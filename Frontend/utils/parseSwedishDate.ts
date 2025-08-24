const monthMap: Record<string, number> = {
    januari: 0,
    februari: 1,
    mars: 2,
    april: 3,
    maj: 4,
    juni: 5,
    juli: 6,
    augusti: 7,
    september: 8,
    oktober: 9,
    november: 10,
    december: 11,
  };
  
  export function parseSwedishDate(input: string): Date | null {
    try {
      const [day, month, year] = input.split(" ");
      const monthIndex = monthMap[month.toLowerCase()];
      if (monthIndex === undefined) return null;
      const date = new Date(Number(year), monthIndex, Number(day));
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }  