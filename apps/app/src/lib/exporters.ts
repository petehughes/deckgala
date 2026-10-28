import { csvEscape, parseCsvLine } from './csv';
import { sanitizeFilename } from './format';
import { uid } from './ids';
import type { ClubData, Swimmer, SwimmerGroup, GroupColor, Gender, PendingImport, ImportOptions } from '../types';

export interface ExportPayload {
  content: string;
  filename: string;
  mimeType: string;
  summary: string;
}

export function buildSwimmerExportPayload(
  club: ClubData,
  { scope = 'club', format = 'json', groupId = '' }: { scope?: 'club' | 'group'; format?: 'json' | 'csv'; groupId?: string } = {}
): ExportPayload | null {
  const dateStr = new Date().toISOString().slice(0, 10);

  if (scope === 'club') {
    const clubSlug = sanitizeFilename(club.clubName);
    if (format === 'json') {
      const payload = {
        schema: 'deckgala_club_v1',
        exportedAt: new Date().toISOString(),
        scope: 'club',
        clubName: club.clubName,
        groups: club.groups
      };
      return {
        content: JSON.stringify(payload, null, 2),
        filename: `${clubSlug}-full-club-${dateStr}.json`,
        mimeType: 'application/json',
        summary: `Exported entire club (${club.groups.length} squads) as JSON`
      };
    } else {
      const headers = ['Group Name', 'Group Coach', 'Group Description', 'Group Color', 'Swimmer Name', 'Age', 'Gender', '50m PB', '100m PB', 'Notes'];
      const rows: (string | number)[][] = [headers];
      club.groups.forEach(g => {
        if (g.swimmers.length === 0) {
          rows.push([
            csvEscape(g.name),
            csvEscape(g.coach),
            csvEscape(g.description),
            csvEscape(g.color),
            '', '', '', '', '', ''
          ]);
        } else {
          g.swimmers.forEach(s => {
            rows.push([
              csvEscape(g.name),
              csvEscape(g.coach),
              csvEscape(g.description),
              csvEscape(g.color),
              csvEscape(s.name),
              s.age ?? '',
              csvEscape(s.gender),
              csvEscape(s.pb50m),
              csvEscape(s.pb100m),
              csvEscape(s.notes)
            ]);
          });
        }
      });
      return {
        content: rows.map(r => r.join(',')).join('\n'),
        filename: `${clubSlug}-full-club-${dateStr}.csv`,
        mimeType: 'text/csv;charset=utf-8;',
        summary: `Exported entire club (${club.groups.length} squads) as CSV`
      };
    }
  } else {
    const group = club.groups.find(g => g.id === groupId);
    if (!group) return null;
    const grpSlug = sanitizeFilename(group.name);

    if (format === 'json') {
      const payload = {
        schema: 'deckgala_group_v1',
        exportedAt: new Date().toISOString(),
        scope: 'group',
        clubName: club.clubName,
        group
      };
      return {
        content: JSON.stringify(payload, null, 2),
        filename: `${grpSlug}-squad-${dateStr}.json`,
        mimeType: 'application/json',
        summary: `Exported "${group.name}" (${group.swimmers.length} swimmers) as JSON`
      };
    } else {
      const headers = ['Group Name', 'Group Coach', 'Group Description', 'Group Color', 'Swimmer Name', 'Age', 'Gender', '50m PB', '100m PB', 'Notes'];
      const rows: (string | number)[][] = [headers];
      group.swimmers.forEach(s => {
        rows.push([
          csvEscape(group.name),
          csvEscape(group.coach),
          csvEscape(group.description),
          csvEscape(group.color),
          csvEscape(s.name),
          s.age ?? '',
          csvEscape(s.gender),
          csvEscape(s.pb50m),
          csvEscape(s.pb100m),
          csvEscape(s.notes)
        ]);
      });
      return {
        content: rows.map(r => r.join(',')).join('\n'),
        filename: `${grpSlug}-squad-${dateStr}.csv`,
        mimeType: 'text/csv;charset=utf-8;',
        summary: `Exported "${group.name}" (${group.swimmers.length} swimmers) as CSV`
      };
    }
  }
}

export function normalizeSwimmerObj(raw: Record<string, unknown> = {}): Swimmer {
  const ageNum = raw.age !== '' && raw.age !== null && raw.age !== undefined ? parseInt(String(raw.age), 10) : '';
  return {
    id: uid('sw'),
    name: String(raw.name || 'Unnamed Swimmer').trim(),
    age: typeof ageNum === 'number' && !isNaN(ageNum) ? ageNum : '',
    gender: (['F', 'M', 'X'].includes(String(raw.gender || '').toUpperCase()) ? String(raw.gender).toUpperCase() : '') as Gender,
    pb50m: String(raw.pb50m || '').trim(),
    pb100m: String(raw.pb100m || '').trim(),
    notes: String(raw.notes || '').trim()
  };
}

export function normalizeGroupObj(raw: Record<string, unknown> = {}): SwimmerGroup {
  const validColors: GroupColor[] = ['cyan', 'teal', 'amber', 'rose', 'violet', 'emerald', 'blue'];
  const rawColor = String(raw.color || '');
  return {
    id: uid('grp'),
    name: String(raw.name || 'Imported Squad').trim(),
    description: String(raw.description || '').trim(),
    coach: String(raw.coach || '').trim(),
    color: validColors.includes(rawColor as GroupColor) ? (rawColor as GroupColor) : 'cyan',
    swimmers: Array.isArray(raw.swimmers)
      ? raw.swimmers
          .map(s => normalizeSwimmerObj(s as Record<string, unknown>))
          .filter(s => s.name.length > 0)
      : []
  };
}

export function parseImportFileText(text: string, fileName: string, defaultClubName: string = 'DeckGala Swim Club'): PendingImport {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new Error('File is empty');
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[') || fileName.toLowerCase().endsWith('.json')) {
    const data = JSON.parse(trimmed);
    let groups: SwimmerGroup[] = [];
    let detectedScope: 'club' | 'group' = 'group';
    let clubName = data.clubName || defaultClubName;

    if (Array.isArray(data.groups)) {
      detectedScope = 'club';
      groups = data.groups.map((g: Record<string, unknown>) => normalizeGroupObj(g));
    } else if (data.group && typeof data.group === 'object') {
      detectedScope = 'group';
      groups = [normalizeGroupObj(data.group as Record<string, unknown>)];
    } else if (Array.isArray(data.swimmers)) {
      detectedScope = 'group';
      groups = [normalizeGroupObj(data as Record<string, unknown>)];
    } else if (Array.isArray(data)) {
      detectedScope = 'group';
      groups = [
        normalizeGroupObj({
          name: fileName.replace(/\.[^.]+$/, ''),
          swimmers: data
        })
      ];
    } else {
      throw new Error('Unrecognized JSON structure');
    }

    const totalSwimmers = groups.reduce((acc, g) => acc + g.swimmers.length, 0);
    return {
      fileName,
      format: 'json',
      detectedScope,
      clubName,
      groups,
      totalSwimmers
    };
  }

  // CSV parsing
  const lines = trimmed
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const firstCells = parseCsvLine(lines[0]).map(c => c.toLowerCase());
  const hasHeader = firstCells.some(c =>
    c.includes('name') || c.includes('swimmer') || c.includes('group') || c.includes('age')
  );

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const colIdx = {
    groupName: firstCells.findIndex(c => c === 'group name' || c === 'group' || c === 'squad'),
    groupCoach: firstCells.findIndex(c => c === 'group coach' || c === 'coach'),
    groupDesc: firstCells.findIndex(c => c === 'group description' || c === 'description'),
    groupColor: firstCells.findIndex(c => c === 'group color' || c === 'color'),
    swimmerName: firstCells.findIndex(c => c === 'swimmer name' || c === 'swimmer' || c === 'name' || c === 'athlete'),
    age: firstCells.findIndex(c => c === 'age'),
    gender: firstCells.findIndex(c => c === 'gender' || c === 'sex'),
    pb50: firstCells.findIndex(c => c.includes('50')),
    pb100: firstCells.findIndex(c => c.includes('100')),
    notes: firstCells.findIndex(c => c.includes('note'))
  };

  const groupsMap = new Map<string, SwimmerGroup>();
  const defaultGroupName = fileName.replace(/\.[^.]+$/, '') || 'Imported Squad';

  dataLines.forEach(line => {
    const cells = parseCsvLine(line);
    if (cells.length === 0) return;

    let grpName = defaultGroupName;
    let coach = '';
    let desc = '';
    let color = 'cyan';
    let swName = '';
    let age = '';
    let gender = '';
    let pb50m = '';
    let pb100m = '';
    let notes = '';

    if (hasHeader && colIdx.swimmerName !== -1) {
      if (colIdx.groupName !== -1 && cells[colIdx.groupName]) grpName = cells[colIdx.groupName];
      if (colIdx.groupCoach !== -1) coach = cells[colIdx.groupCoach] || '';
      if (colIdx.groupDesc !== -1) desc = cells[colIdx.groupDesc] || '';
      if (colIdx.groupColor !== -1 && cells[colIdx.groupColor]) color = cells[colIdx.groupColor];
      swName = cells[colIdx.swimmerName] || '';
      if (colIdx.age !== -1) age = cells[colIdx.age] || '';
      if (colIdx.gender !== -1) gender = cells[colIdx.gender] || '';
      if (colIdx.pb50 !== -1) pb50m = cells[colIdx.pb50] || '';
      if (colIdx.pb100 !== -1) pb100m = cells[colIdx.pb100] || '';
      if (colIdx.notes !== -1) notes = cells[colIdx.notes] || '';
    } else {
      swName = cells[0] || '';
      age = cells[1] || '';
      gender = cells[2] || '';
      pb50m = cells[3] || '';
      pb100m = cells[4] || '';
      notes = cells[5] || '';
    }

    if (!groupsMap.has(grpName)) {
      groupsMap.set(
        grpName,
        normalizeGroupObj({
          name: grpName,
          coach,
          description: desc,
          color,
          swimmers: []
        })
      );
    }

    if (swName.trim().length > 0) {
      groupsMap.get(grpName)!.swimmers.push(
        normalizeSwimmerObj({
          name: swName,
          age,
          gender,
          pb50m,
          pb100m,
          notes
        })
      );
    }
  });

  const groups = Array.from(groupsMap.values());
  const detectedScope: 'club' | 'group' = groups.length > 1 ? 'club' : 'group';
  const totalSwimmers = groups.reduce((acc, g) => acc + g.swimmers.length, 0);

  return {
    fileName,
    format: 'csv',
    detectedScope,
    clubName: defaultClubName,
    groups,
    totalSwimmers
  };
}

export function applyImportToClub(
  club: ClubData,
  activeGroupId: string | null,
  selectedGroupIds: string[],
  pendingImport: PendingImport,
  options: ImportOptions
): {
  club: ClubData;
  activeGroupId: string | null;
  selectedGroupIds: string[];
  message: string;
} {
  const { targetScope, clubImportMode, groupImportTarget, newGroupName } = options;

  const nextClub: ClubData = {
    clubName: club.clubName,
    groups: club.groups.map(g => ({ ...g, swimmers: [...g.swimmers] })),
    pools: Array.isArray(club.pools) ? [...club.pools] : [],
    coaches: Array.isArray(club.coaches) ? [...club.coaches] : [],
    scheduledSessions: Array.isArray(club.scheduledSessions) ? [...club.scheduledSessions] : [],
    staffOverrides: Array.isArray(club.staffOverrides) ? [...club.staffOverrides] : [],
    clubClosures: Array.isArray(club.clubClosures) ? [...club.clubClosures] : []
  };
  let nextActiveGroupId = activeGroupId;
  let nextSelectedGroupIds = [...selectedGroupIds];
  let message = 'Import complete';

  if (targetScope === 'club') {
    if (clubImportMode === 'replace') {
      nextClub.clubName = pendingImport.clubName || nextClub.clubName;
      nextClub.groups = pendingImport.groups.map(g => normalizeGroupObj(g as unknown as Record<string, unknown>));
      nextActiveGroupId = nextClub.groups[0]?.id || null;
      nextSelectedGroupIds = nextClub.groups.slice(0, 2).map(g => g.id);
      message = `Replaced club roster with ${nextClub.groups.length} squads (${pendingImport.totalSwimmers} swimmers)`;
    } else {
      let addedGroups = 0;
      let addedSwimmers = 0;
      pendingImport.groups.forEach(impGrp => {
        const existing = nextClub.groups.find(
          g => g.name.toLowerCase() === impGrp.name.toLowerCase()
        );
        if (existing) {
          const existingNames = new Set(existing.swimmers.map(s => s.name.toLowerCase()));
          impGrp.swimmers.forEach(s => {
            if (!existingNames.has(s.name.toLowerCase())) {
              existing.swimmers.push(normalizeSwimmerObj(s as unknown as Record<string, unknown>));
              existingNames.add(s.name.toLowerCase());
              addedSwimmers++;
            }
          });
        } else {
          const newG = normalizeGroupObj(impGrp as unknown as Record<string, unknown>);
          nextClub.groups.push(newG);
          addedGroups++;
          addedSwimmers += newG.swimmers.length;
        }
      });
      if (!nextActiveGroupId && nextClub.groups.length > 0) {
        nextActiveGroupId = nextClub.groups[0].id;
      }
      message = `Merged ${addedGroups} new squads and ${addedSwimmers} swimmers into club`;
    }
  } else {
    const allSwimmers: Swimmer[] = [];
    pendingImport.groups.forEach(g => {
      g.swimmers.forEach(s => allSwimmers.push(normalizeSwimmerObj(s as unknown as Record<string, unknown>)));
    });

    if (groupImportTarget === '__new__') {
      const grpName = (newGroupName || '').trim() || pendingImport.groups[0]?.name || 'Imported Squad';
      const baseMeta = pendingImport.groups[0] || ({} as Partial<SwimmerGroup>);
      const newGrp: SwimmerGroup = {
        id: uid('grp'),
        name: grpName,
        description: baseMeta.description || 'Imported group',
        coach: baseMeta.coach || '',
        color: baseMeta.color || 'cyan',
        swimmers: allSwimmers
      };
      nextClub.groups.push(newGrp);
      nextActiveGroupId = newGrp.id;
      message = `Created squad "${grpName}" with ${allSwimmers.length} swimmers`;
    } else {
      const targetGrp = nextClub.groups.find(g => g.id === groupImportTarget);
      if (!targetGrp) {
        throw new Error('Target squad not found');
      }
      const existingNames = new Set(targetGrp.swimmers.map(s => s.name.toLowerCase()));
      let added = 0;
      allSwimmers.forEach(s => {
        if (!existingNames.has(s.name.toLowerCase())) {
          targetGrp.swimmers.push(s);
          existingNames.add(s.name.toLowerCase());
          added++;
        }
      });
      nextActiveGroupId = targetGrp.id;
      message = `Imported ${added} swimmers into "${targetGrp.name}"`;
    }
  }

  return {
    club: nextClub,
    activeGroupId: nextActiveGroupId,
    selectedGroupIds: nextSelectedGroupIds,
    message
  };
}

