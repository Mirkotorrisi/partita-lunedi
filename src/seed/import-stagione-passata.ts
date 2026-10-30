import config from '@payload-config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'

import type { Giocatori, Partite, Squadre } from '@/payload-types'

type Ruolo = Giocatori['ruolo']
type RigaFormazione = NonNullable<Partite['formazioneA']>[number]
type CsvTable = { header: string[]; rows: string[][] }

type TeamSide = 'neri' | 'rossi'

type MatchMapping = {
  neri: string[]
  rossi: string[]
}

type PlayerDefinition = {
  nome: string
  cognome: string
  ruolo?: Ruolo
  soprannome?: string
  attivo?: boolean
}

type ImportMapping = {
  /** Nome squadra da usare come "Neri". Se non esiste viene creata. */
  teamNameNeri: string
  /** Nome squadra da usare come "Rossi". Se non esiste viene creata. */
  teamNameRossi: string
  /** Colore da usare quando la squadra "Neri" va creata. */
  teamColorNeri?: string
  /** Colore da usare quando la squadra "Rossi" va creata. */
  teamColorRossi?: string
  /**
   * Alias dei colori letti in STATISTICHE...Squadre.csv.
   * Esempio: { "VERDI": "rossi", "NERI": "neri" }
   */
  colorAliases: Record<string, TeamSide>
  /**
   * Mapping formazione per data (formato come nel CSV: es. "8/9", "12/1").
   * Ogni giocatore deve comparire una sola volta nella giornata.
   */
  matches: Record<string, MatchMapping>
  /**
   * Alias nomi dal CSV verso un nome canonico usato anche in matches/players.
   * Esempio: { "Lo turco": "Lo Turco", "FABRIZIO P": "Fabrizio P" }
   */
  playerAliases?: Record<string, string>
  /** Alias date tra CSV diversi, es. { "29/7": "29/9" }. */
  dateAliases?: Record<string, string>
  /**
   * Definizione opzionale per i giocatori non trovati nel DB.
   * Se non fornita, il giocatore viene creato dal nome CSV con fallback automatici.
   * ruolo è opzionale: se manca viene usato "difensore".
   */
  players?: Record<string, PlayerDefinition>
}

type PlayerStats = {
  csvName: string
  canonicalName: string
  votesByDate: Record<string, number | null>
  goalsByDate: Record<string, number>
}

type TeamGoals = {
  neri: number
  rossi: number
}

const DISABLE_REVALIDATE_CONTEXT = { disableRevalidate: true }

const [, , votesCsvPath, goalsCsvPath, teamsCsvPath, mappingJsonPath, seasonStartYearArg, modeArg] =
  process.argv
const dryRun = modeArg === 'dry-run'

const usage = () => {
  console.error(
    [
      'Uso:',
      'pnpm import:stagione-passata -- "<path-voti.csv>" "<path-gol.csv>" "<path-squadre.csv>" "<path-mapping.json>" <seasonStartYear> [dry-run]',
      '',
      'Esempio:',
      'pnpm import:stagione-passata -- "/Users/me/Voti.csv" "/Users/me/Gol.csv" "/Users/me/Squadre.csv" "src/seed/import-stagione-passata.mapping.example.json" 2025 dry-run',
    ].join('\n'),
  )
}

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()
    .trim()

const normalizeDateLabel = (raw: string): string => {
  const clean = raw.trim()
  const match = clean.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (!match) {
    throw new Error(`Formato data non valido "${raw}". Atteso "d/m".`)
  }
  const day = String(Number(match[1]))
  const month = String(Number(match[2]))
  return `${day}/${month}`
}

const mapDateLabel = (raw: string, aliases: Record<string, string> | undefined): string => {
  const normalized = normalizeDateLabel(raw)
  const mapped = aliases?.[normalized]
  return mapped ? normalizeDateLabel(mapped) : normalized
}

const parseItNumber = (value: string): number | null => {
  const clean = value.trim()
  if (!clean) return null
  const normalized = clean.replace(',', '.')
  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) {
    throw new Error(`Numero non valido "${value}"`)
  }
  return parsed
}

const parseCsv = (content: string): CsvTable => {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
  if (lines.length < 2) {
    throw new Error('CSV senza righe utili.')
  }

  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const next = line[i + 1]
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i++
          continue
        }
        inQuotes = !inQuotes
        continue
      }
      if (char === ',' && !inQuotes) {
        out.push(current.trim())
        current = ''
        continue
      }
      current += char
    }
    out.push(current.trim())
    return out
  }

  const [rawHeader, ...rawRows] = lines
  const header = parseLine(rawHeader)
  const rows = rawRows.map(parseLine)
  return { header, rows }
}

const buildStats = (
  votes: CsvTable,
  goals: CsvTable,
  aliases: Record<string, string>,
  dateAliases: Record<string, string> | undefined,
): Map<string, PlayerStats> => {
  const voteDates = votes.header.slice(1).map((value) => mapDateLabel(value, dateAliases))
  const goalDates = goals.header.slice(1).map((value) => mapDateLabel(value, dateAliases))

  if (voteDates.length !== goalDates.length || voteDates.some((value, index) => value !== goalDates[index])) {
    throw new Error(
      `Le colonne data di voti e gol non coincidono.\nVoti: ${voteDates.join(', ')}\nGol: ${goalDates.join(', ')}`,
    )
  }

  const stats = new Map<string, PlayerStats>()

  const upsert = (csvName: string): PlayerStats => {
    const canonicalName = aliases[csvName] ?? csvName
    const key = normalize(canonicalName)
    const existing = stats.get(key)
    if (existing && existing.csvName !== csvName) {
      throw new Error(
        `Collisione nomi: "${csvName}" e "${existing.csvName}" puntano allo stesso canonical "${canonicalName}".`,
      )
    }
    if (existing) return existing
    const created: PlayerStats = {
      csvName,
      canonicalName,
      votesByDate: {},
      goalsByDate: {},
    }
    stats.set(key, created)
    return created
  }

  for (const row of votes.rows) {
    const csvName = row[0]?.trim()
    if (!csvName) continue
    const entry = upsert(csvName)
    voteDates.forEach((date, index) => {
      entry.votesByDate[date] = parseItNumber(row[index + 1] ?? '')
    })
  }

  for (const row of goals.rows) {
    const csvName = row[0]?.trim()
    if (!csvName) continue
    const entry = upsert(csvName)
    goalDates.forEach((date, index) => {
      const parsed = parseItNumber(row[index + 1] ?? '')
      entry.goalsByDate[date] = parsed === null ? 0 : Math.trunc(parsed)
    })
  }

  return stats
}

const buildScoreByDate = (teams: CsvTable, mapping: ImportMapping): Map<string, TeamGoals> => {
  const dateIndex = teams.header.findIndex((column) => normalize(column) === 'data')
  if (dateIndex < 0) throw new Error('CSV squadre senza colonna DATA.')

  const knownTeamColumns = teams.header
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => mapping.colorAliases[column.toUpperCase()])
  if (knownTeamColumns.length !== 2) {
    throw new Error(
      `CSV squadre: servono esattamente 2 colonne squadra mappate in colorAliases, trovate ${knownTeamColumns.length}.`,
    )
  }

  const output = new Map<string, TeamGoals>()
  for (const row of teams.rows) {
    const rawDate = row[dateIndex]?.trim()
    if (!rawDate) continue
    const date = mapDateLabel(rawDate, mapping.dateAliases)
    const goalBySide: Partial<TeamGoals> = {}

    for (const { column, index } of knownTeamColumns) {
      const side = mapping.colorAliases[column.toUpperCase()]
      const parsed = parseItNumber(row[index] ?? '')
      if (parsed === null) continue
      goalBySide[side] = Math.trunc(parsed)
    }

    if (goalBySide.neri === undefined || goalBySide.rossi === undefined) continue
    output.set(date, { neri: goalBySide.neri, rossi: goalBySide.rossi })
  }
  return output
}

const inferDateIso = (dateLabel: string, seasonStartYear: number): string => {
  const [dayText, monthText] = dateLabel.split('/')
  const day = Number(dayText)
  const month = Number(monthText)
  if (!day || !month) throw new Error(`Data non valida "${dateLabel}".`)
  const year = month >= 8 ? seasonStartYear : seasonStartYear + 1
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return iso
}

const defaultRuolo: Ruolo = 'difensore'

const inferPlayerFromCsvName = (canonicalName: string): PlayerDefinition => {
  const clean = canonicalName.trim().replace(/\s+/g, ' ')
  const parts = clean.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return {
      nome: parts[0],
      cognome: parts.slice(1).join(' '),
      ruolo: defaultRuolo,
      soprannome: clean,
      attivo: true,
    }
  }

  return {
    nome: clean,
    cognome: 'Sconosciuto',
    ruolo: defaultRuolo,
    soprannome: clean,
    attivo: true,
  }
}

const resolveOrCreateTeam = async ({
  teamName,
  fallbackColor,
  teamsByName,
  dryRunMode,
  payload,
}: {
  teamName: string
  fallbackColor: string | undefined
  teamsByName: Map<string, Squadre>
  dryRunMode: boolean
  payload: Awaited<ReturnType<typeof getPayload>>
}): Promise<Squadre> => {
  const key = normalize(teamName)
  const existing = teamsByName.get(key)
  if (existing) return existing

  if (!fallbackColor) {
    throw new Error(
      `Squadra "${teamName}" non trovata nel DB. Per crearla automaticamente aggiungi il colore in mapping (teamColorNeri/teamColorRossi).`,
    )
  }

  if (dryRunMode) {
    return {
      id: -1,
      nome: teamName,
      colore: fallbackColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const created = await payload.create({
    collection: 'squadre',
    data: {
      nome: teamName,
      colore: fallbackColor,
    },
    context: DISABLE_REVALIDATE_CONTEXT,
  })
  teamsByName.set(key, created)
  return created
}

const main = async () => {
  if (!votesCsvPath || !goalsCsvPath || !teamsCsvPath || !mappingJsonPath || !seasonStartYearArg) {
    usage()
    process.exit(1)
  }

  const seasonStartYear = Number(seasonStartYearArg)
  if (!Number.isInteger(seasonStartYear)) {
    throw new Error(`seasonStartYear non valido: "${seasonStartYearArg}"`)
  }

  const [votesCsvRaw, goalsCsvRaw, teamsCsvRaw, mappingRaw] = await Promise.all([
    readFile(path.resolve(votesCsvPath), 'utf8'),
    readFile(path.resolve(goalsCsvPath), 'utf8'),
    readFile(path.resolve(teamsCsvPath), 'utf8'),
    readFile(path.resolve(mappingJsonPath), 'utf8'),
  ])

  const votesCsv = parseCsv(votesCsvRaw)
  const goalsCsv = parseCsv(goalsCsvRaw)
  const teamsCsv = parseCsv(teamsCsvRaw)
  const mapping = JSON.parse(mappingRaw) as ImportMapping
  const playerAliases = mapping.playerAliases ?? {}

  const stats = buildStats(votesCsv, goalsCsv, playerAliases, mapping.dateAliases)
  const scoreByDate = buildScoreByDate(teamsCsv, mapping)

  const payload = await getPayload({ config })
  const existingTeams = await payload.find({
    collection: 'squadre',
    depth: 0,
    limit: 200,
    pagination: false,
  })
  const teamsByName = new Map(existingTeams.docs.map((team) => [normalize(team.nome), team]))
  const teamNeri = await resolveOrCreateTeam({
    teamName: mapping.teamNameNeri,
    fallbackColor: mapping.teamColorNeri,
    teamsByName,
    dryRunMode: dryRun,
    payload,
  })
  const teamRossi = await resolveOrCreateTeam({
    teamName: mapping.teamNameRossi,
    fallbackColor: mapping.teamColorRossi,
    teamsByName,
    dryRunMode: dryRun,
    payload,
  })

  const existingPlayers = await payload.find({
    collection: 'giocatori',
    depth: 0,
    limit: 1000,
    pagination: false,
  })

  const playerCandidates = new Map<string, Giocatori[]>()
  const addCandidate = (key: string, player: Giocatori) => {
    if (!key) return
    const bucket = playerCandidates.get(key) ?? []
    if (!bucket.some((existing) => existing.id === player.id)) {
      bucket.push(player)
    }
    playerCandidates.set(key, bucket)
  }

  for (const player of existingPlayers.docs) {
    addCandidate(normalize(`${player.nome} ${player.cognome}`), player)
    addCandidate(normalize(player.nomeCompleto ?? ''), player)
    addCandidate(normalize(player.soprannome ?? ''), player)
    addCandidate(normalize(player.nome), player)
    addCandidate(normalize(player.cognome), player)
  }

  const resolvedPlayers = new Map<
    string,
    {
      canonicalName: string
      doc: Giocatori
      stats: PlayerStats
    }
  >()
  const ambiguousPlayers: Array<{ name: string; candidates: string[] }> = []
  let createdPlayers = 0

  for (const stat of stats.values()) {
    const key = normalize(stat.canonicalName)
    const candidates = playerCandidates.get(key) ?? []
    if (candidates.length === 1) {
      resolvedPlayers.set(key, { canonicalName: stat.canonicalName, doc: candidates[0], stats: stat })
      continue
    }
    if (candidates.length > 1) {
      ambiguousPlayers.push({
        name: stat.canonicalName,
        candidates: candidates.map((c) => `${c.nome} ${c.cognome}`),
      })
      continue
    }

    const baseDefinition = mapping.players?.[stat.canonicalName] ?? inferPlayerFromCsvName(stat.canonicalName)
    const ruolo: Ruolo = baseDefinition.ruolo ?? defaultRuolo
    const definition: Required<Pick<PlayerDefinition, 'nome' | 'cognome'>> &
      Omit<PlayerDefinition, 'nome' | 'cognome'> = {
      ...baseDefinition,
      nome: baseDefinition.nome.trim(),
      cognome: baseDefinition.cognome.trim(),
      ruolo,
    }
    if (!definition.nome || !definition.cognome) {
      throw new Error(
        `Dati non validi per "${stat.canonicalName}": nome/cognome vuoti dopo normalizzazione.`,
      )
    }

    if (!dryRun) {
      const created = await payload.create({
        collection: 'giocatori',
        data: {
          nome: definition.nome,
          cognome: definition.cognome,
          soprannome: definition.soprannome,
          ruolo,
          attivo: definition.attivo ?? true,
        },
        context: DISABLE_REVALIDATE_CONTEXT,
      })
      resolvedPlayers.set(key, { canonicalName: stat.canonicalName, doc: created, stats: stat })
      createdPlayers++
    } else {
      const pseudoPlayer = {
        id: `dry-${key}`,
        nome: definition.nome,
        cognome: definition.cognome,
        soprannome: definition.soprannome ?? null,
        ruolo,
        attivo: definition.attivo ?? true,
      } as unknown as Giocatori
      resolvedPlayers.set(key, { canonicalName: stat.canonicalName, doc: pseudoPlayer, stats: stat })
    }
  }

  if (ambiguousPlayers.length > 0) {
    const chunks: string[] = []
    if (ambiguousPlayers.length > 0) {
      chunks.push(
        `Giocatori ambigui:`,
        ...ambiguousPlayers
          .sort((a, b) => a.name.localeCompare(b.name, 'it'))
          .map((item) => `- ${item.name}: ${item.candidates.join(' | ')}`),
      )
    }
    throw new Error(`${chunks.join('\n')}\nUsa playerAliases nel file di mapping.`)
  }

  const dates = new Set<string>()
  for (const stat of stats.values()) {
    Object.keys(stat.votesByDate).forEach((date) => dates.add(date))
    Object.keys(stat.goalsByDate).forEach((date) => dates.add(date))
  }

  const orderedDates = [...dates].sort((a, b) => {
    const [aDay, aMonth] = a.split('/').map(Number)
    const [bDay, bMonth] = b.split('/').map(Number)
    const aYear = aMonth >= 8 ? seasonStartYear : seasonStartYear + 1
    const bYear = bMonth >= 8 ? seasonStartYear : seasonStartYear + 1
    const aDate = new Date(Date.UTC(aYear, aMonth - 1, aDay)).getTime()
    const bDate = new Date(Date.UTC(bYear, bMonth - 1, bDay)).getTime()
    return aDate - bDate
  })

  let createdMatches = 0
  let updatedMatches = 0

  for (const dateLabel of orderedDates) {
    const formationMap = mapping.matches[dateLabel]
    if (!formationMap) {
      throw new Error(`Manca mapping.matches["${dateLabel}"]`)
    }

    const presentSet = new Set<string>()
    for (const stat of stats.values()) {
      const vote = stat.votesByDate[dateLabel]
      const goals = stat.goalsByDate[dateLabel] ?? 0
      if (vote !== null && vote !== undefined || goals > 0) {
        presentSet.add(normalize(stat.canonicalName))
      }
    }

    const teamNeriKeys = formationMap.neri.map((name) => normalize(name))
    const teamRossiKeys = formationMap.rossi.map((name) => normalize(name))

    const duplicates = teamNeriKeys.filter((name) => teamRossiKeys.includes(name))
    if (duplicates.length > 0) {
      throw new Error(`Data ${dateLabel}: giocatori duplicati in entrambe le squadre: ${duplicates.join(', ')}`)
    }

    const mappedKeys = new Set([...teamNeriKeys, ...teamRossiKeys])
    const missingFromMapping = [...presentSet].filter((key) => !mappedKeys.has(key))
    if (missingFromMapping.length > 0) {
      throw new Error(
        `Data ${dateLabel}: presenti nel CSV ma assenti nel mapping squadre:\n- ${missingFromMapping
          .map((key) => resolvedPlayers.get(key)?.canonicalName ?? key)
          .join('\n- ')}`,
      )
    }
    const extrasInMapping = [...mappedKeys].filter((key) => !presentSet.has(key))
    if (extrasInMapping.length > 0) {
      throw new Error(
        `Data ${dateLabel}: presenti nel mapping ma assenti nel CSV:\n- ${extrasInMapping
          .map((key) => resolvedPlayers.get(key)?.canonicalName ?? key)
          .join('\n- ')}`,
      )
    }

    const teamScore = scoreByDate.get(dateLabel)
    if (!teamScore) throw new Error(`Data ${dateLabel}: punteggio squadra non trovato in CSV squadre.`)

    const makeLine = (key: string): RigaFormazione => {
      const resolved = resolvedPlayers.get(key)
      if (!resolved) {
        throw new Error(`Data ${dateLabel}: giocatore non risolto "${key}"`)
      }
      const goals = resolved.stats.goalsByDate[dateLabel] ?? 0
      const vote = resolved.stats.votesByDate[dateLabel]
      return {
        giocatore: resolved.doc.id,
        gol: goals,
        voto: vote,
      }
    }

    const formazioneA = teamNeriKeys.map(makeLine)
    const formazioneB = teamRossiKeys.map(makeLine)
    const goalsA = formazioneA.reduce((sum, row) => sum + (row.gol ?? 0), 0)
    const goalsB = formazioneB.reduce((sum, row) => sum + (row.gol ?? 0), 0)
    const autogolA = Math.max(0, teamScore.neri - goalsA)
    const autogolB = Math.max(0, teamScore.rossi - goalsB)
    if (teamScore.neri < goalsA || teamScore.rossi < goalsB) {
      payload.logger.warn(
        `Data ${dateLabel}: gol individuali superiori al punteggio da CSV squadre (Neri ${goalsA}/${teamScore.neri}, Rossi ${goalsB}/${teamScore.rossi}). Uso i gol individuali come fonte principale.`,
      )
    }

    const giornoIso = inferDateIso(dateLabel, seasonStartYear)
    const dataPartita = `${giornoIso}T19:00:00.000Z`
    const existingMatch = await payload.find({
      collection: 'partite',
      where: { giorno: { equals: giornoIso } },
      depth: 0,
      limit: 1,
    })

    const writeData = {
      data: dataPartita,
      squadraA: teamNeri.id,
      squadraB: teamRossi.id,
      formazioneA,
      formazioneB,
      autogolA,
      autogolB,
    }

    if (dryRun) continue

    if (existingMatch.totalDocs > 0) {
      await payload.update({
        collection: 'partite',
        id: existingMatch.docs[0].id,
        data: writeData,
        context: DISABLE_REVALIDATE_CONTEXT,
      })
      updatedMatches++
    } else {
      await payload.create({
        collection: 'partite',
        data: writeData,
        context: DISABLE_REVALIDATE_CONTEXT,
      })
      createdMatches++
    }
  }

  if (dryRun) {
    payload.logger.info(
      `[dry-run] OK: risolti ${resolvedPlayers.size} giocatori (${createdPlayers} da creare), giornate ${orderedDates.length}.`,
    )
  } else {
    payload.logger.info(
      `Import completato: ${orderedDates.length} giornate, ${createdPlayers} giocatori creati, ${createdMatches} partite create, ${updatedMatches} partite aggiornate.`,
    )
  }
}

await main()
