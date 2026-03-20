export interface VideoSet {
    quality: '480p' | '720p' | '1080p';
    url: string;
  }

  export interface Lecture {
    id: string;
    lectureNumber: number;
    title: string;
    videos: VideoSet[];
  }

  export interface Chapter {
    id: string;
    name: string;
    lectures: Lecture[];
  }

  export interface Subject {
    id: string;
    name: string;
    shortName: string;
    color: string;
    chapters: Chapter[];
  }

  function makeId(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }


  function groupByLecture(urls: string[]): Lecture[] {
    const lectureMap = new Map<string, Map<string, { url: string; timestamp: number }>>();

    for (const url of urls) {
      let manualNum: number | null = null;
      let manualPart: number | null = null;
      let cleanUrl = url;

      // Extract manual labels if present: [[L-1]]url or [[L-1-P2]]url
      const manualMatch = url.match(/^\[\[L-(\d+)(?:-P(\d+))?\]\](.*)/);
      if (manualMatch) {
         manualNum = parseInt(manualMatch[1], 10);
         manualPart = manualMatch[2] ? parseInt(manualMatch[2], 10) : null;
         cleanUrl = manualMatch[3];
      }

      const quality: '480p' | '720p' | '1080p' = cleanUrl.includes('output_480') ? '480p' : cleanUrl.includes('output_720') ? '720p' : '1080p';
      const base = cleanUrl.replace(/\/output_(480|720|1080)\.mp4$/, '');
      const filename = base.split('/').pop() ?? '';
      const decoded = decodeURIComponent(filename.replace('.mp4', ''));
      
      let num = manualNum;
      let part = manualPart;

      if (num === null) {
        // Fallback to automatic extraction from filename
        let numMatch = decoded.match(/[ \-_]L(?:ec)?(?:ture)?[ \-_]?(\d+)/i);
        if (!numMatch) {
           const preTsMatch = decoded.match(/(\d+)-(\d{10,})$/);
           if (preTsMatch) {
              numMatch = [null, preTsMatch[1]] as any;
           } else {
              numMatch = decoded.match(/(?:^|[ \-_])(\d+)(?:[ \-_]|$)/);
           }
        }
        num = numMatch ? parseInt(numMatch[1], 10) : 1;
        
        const partMatch = decoded.match(/Part[ \-_]?(\d+)/i);
        part = partMatch ? parseInt(partMatch[1], 10) : null;
      }
      
      const tsMatch = decoded.match(/-(\d{10,})$/);
      const timestamp = tsMatch ? parseInt(tsMatch[1], 10) : 0;

      const key = `${num}${part ? `-P${part}` : ''}`;
      
      if (!lectureMap.has(key)) {
        lectureMap.set(key, new Map());
      }
      
      const qualityMap = lectureMap.get(key)!;
      const existing = qualityMap.get(quality);
      
      if (!existing || timestamp > existing.timestamp) {
        qualityMap.set(quality, { url: cleanUrl, timestamp });
      }
    }

    const qualityOrder: Record<string, number> = { '480p': 0, '720p': 1, '1080p': 2 };
    const result: Lecture[] = [];
    
    for (const [key, qualityMap] of lectureMap.entries()) {
      const isPart = key.includes('-P');
      const num = parseInt(key.split('-')[0], 10);
      const part = isPart ? parseInt(key.split('-P')[1], 10) : null;
      
      const videos: VideoSet[] = Array.from(qualityMap.entries()).map(([q, data]) => ({
        quality: q as any,
        url: data.url
      }));
      videos.sort((a, b) => qualityOrder[a.quality] - qualityOrder[b.quality]);
      
      result.push({
        id: `lec-${key}`,
        lectureNumber: num,
        title: `Lecture ${num}${part ? ` Part ${part}` : ''}`,
        videos
      });
    }

    result.sort((a, b) => {
      const aKey = a.id.replace('lec-', '');
      const bKey = b.id.replace('lec-', '');
      const aNum = parseInt(aKey.split('-')[0], 10);
      const bNum = parseInt(bKey.split('-')[0], 10);
      if (aNum !== bNum) return aNum - bNum;
      
      const aPart = aKey.includes('-P') ? parseInt(aKey.split('-P')[1], 10) : 0;
      const bPart = bKey.includes('-P') ? parseInt(bKey.split('-P')[1], 10) : 0;
      return aPart - bPart;
    });
    
    return result;
  }

  function buildChapters(raw: Record<string, string[]>): Chapter[] {
    return Object.entries(raw).map(([name, urls]) => ({
      id: makeId(name),
      name,
      lectures: groupByLecture(urls),
    }));
  }

import rawLectures from "@/assets/output.txt?raw";

function parseTxt(content: string): Subject[] {
  const lines = content.split('\n');
  const subs: Subject[] = [];
  let currentSubject: Subject | null = null;
  let currentChapters: Record<string, string[]> = {};
  let currentChapterName: string | null = null;
  let currentManualLabel: string | null = null;

  const subjectMeta: Record<string, { id: string; short: string; color: string }> = {
    'PHYSICS': { id: 'physics', short: 'PHY', color: '#6366f1' },
    'CHEMISTRY (PHYSICAL & INORGANIC)': { id: 'physical-inorganic-chemistry', short: 'P+I CHE', color: '#10b981' },
    'CHEMISTRY (ORGANIC)': { id: 'organic-chemistry', short: 'ORG CHE', color: '#f59e0b' }
  };

  const finalizeSubject = () => {
    if (currentSubject) {
      currentSubject.chapters = buildChapters(currentChapters);
      subs.push(currentSubject);
    }
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.match(/^=+/)) {
      const potential = line.replace(/=/g, '').trim();
      if (subjectMeta[potential]) {
        finalizeSubject();
        const meta = subjectMeta[potential];
        currentSubject = {
          id: meta.id,
          name: potential,
          shortName: meta.short,
          color: meta.color,
          chapters: []
        };
        currentChapters = {};
        currentChapterName = null;
        currentManualLabel = null;
        continue;
      }
    }

    if (subjectMeta[line]) {
       finalizeSubject();
       const meta = subjectMeta[line];
       currentSubject = {
         id: meta.id,
         name: line,
         shortName: meta.short,
         color: meta.color,
         chapters: []
       };
       currentChapters = {};
       currentChapterName = null;
       currentManualLabel = null;
       continue;
    }

    if (line.startsWith('---') && line.endsWith('---')) {
      currentChapterName = line.replace(/---/g, '').trim();
      currentChapters[currentChapterName] = [];
      currentManualLabel = null;
      continue;
    }

    // Manual Lecture Label Detection (L-1, L 1, Lec 1, Lecture-2, etc.)
    const labelMatch = line.match(/^L(?:ec)?(?:ture)?[ \-_]?(\d+)(?:[ \-_]P(?:art)?[ \-_]?(\d+))?$/i);
    if (labelMatch) {
       const num = labelMatch[1];
       const part = labelMatch[2];
       currentManualLabel = `[[L-${num}${part ? `-P${part}` : ''}]]`;
       continue;
    }

    if (line.startsWith('https://') && currentChapterName) {
      const finalUrl = currentManualLabel ? `${currentManualLabel}${line}` : line;
      currentChapters[currentChapterName].push(finalUrl);
    }
  }
  finalizeSubject();
  return subs;
}

export const subjects: Subject[] = parseTxt(rawLectures);