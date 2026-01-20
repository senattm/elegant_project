export const SHOE_SIZES = ["36", "37", "38", "39", "40", "41"];
export const BAG_SIZES = ["STD"];
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL"];

export const CATEGORY_IDS = {
    SHOES: 3,
    BAGS: 4,
};

export const getProductSizes = (categoryId: number, parentId?: number | null): string[] => {
    const ids = [Number(categoryId)];
    if (parentId) ids.push(Number(parentId));

    if (ids.includes(CATEGORY_IDS.BAGS)) {
        return BAG_SIZES;
    }

    if (ids.includes(CATEGORY_IDS.SHOES)) {
        return SHOE_SIZES;
    }

    return CLOTHING_SIZES;
};
