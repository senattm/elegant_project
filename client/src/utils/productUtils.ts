const ORDERS = ['XS', 'S', 'M', 'L', 'XL', 'STANDART', 'STD'];

export const sortSizes = (sizes: string[]): string[] => {
    return [...sizes].sort((a, b) => {
        const aIdx = ORDERS.indexOf(a.toUpperCase());
        const bIdx = ORDERS.indexOf(b.toUpperCase());

        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;

        const nA = parseFloat(a), nB = parseFloat(b);
        return (!isNaN(nA) && !isNaN(nB)) ? nA - nB : a.localeCompare(b);
    });
};
