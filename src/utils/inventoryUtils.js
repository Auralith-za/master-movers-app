/**
 * Normalizes any inventory items input (object, array, JSON string, nested items object)
 * into a clean { [itemIdKey]: quantity } map.
 */
export function normalizeInventory(itemsInput) {
    if (!itemsInput) return {};

    let raw = itemsInput;

    // Handle stringified JSON
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        } catch (_) {
            return {};
        }
    }

    if (!raw || typeof raw !== 'object') return {};

    // Unwrap nested .items property if present
    if (raw.items && typeof raw.items === 'object') {
        raw = raw.items;
    }

    const cleanInventory = {};

    // If it's an array of item objects [{ id, quantity, room }, ...]
    if (Array.isArray(raw)) {
        for (const item of raw) {
            if (!item) continue;
            const qty = Number(item.quantity || item.qty || item.count || 1);
            if (qty <= 0) continue;
            const id = item.id || item.itemId || item.name;
            if (id) {
                const roomSuffix = item.room ? `__room:${item.room}` : '';
                cleanInventory[`${id}${roomSuffix}`] = qty;
            }
        }
        return cleanInventory;
    }

    // Metadata keys to ignore if raw object contains top-level quote metadata
    const metadataKeys = new Set([
        'extraCollections', 'extra_collections',
        'extraDrops', 'extra_drops',
        'rejection_reason', 'reject_reason',
        'referral_source', 'referralSource',
        'special_wrapping', 'total_volume', 'breakdown',
        'items'
    ]);

    for (const [key, val] of Object.entries(raw)) {
        if (metadataKeys.has(key)) continue;
        const qty = Number(val);
        if (!isNaN(qty) && qty > 0) {
            cleanInventory[key] = qty;
        }
    }

    return cleanInventory;
}

/**
 * Parses an inventory item key into its item ID, variation, and room category.
 * e.g., "bed_double_king__room:Master Bedroom" -> { itemId: "bed_double_king", variation: null, room: "Master Bedroom" }
 */
export function parseInventoryKey(idKey) {
    if (!idKey) return { itemId: '', variation: null, room: null };

    let key = idKey;
    let room = null;

    if (key.includes('__room:')) {
        const parts = key.split('__room:');
        key = parts[0];
        room = parts[1];
    } else if (key.includes('_room:')) {
        const parts = key.split('_room:');
        key = parts[0];
        room = parts[1];
    } else if (key.includes(' Room:')) {
        const parts = key.split(' Room:');
        key = parts[0];
        room = parts[1];
    } else if (key.includes(' room:')) {
        const parts = key.split(' room:');
        key = parts[0];
        room = parts[1];
    }

    if (room) {
        room = room.replace(/^room:\s*/i, '').trim();
    }

    let variation = null;
    if (key.includes('_')) {
        const parts = key.split('_');
        key = parts[0];
        variation = parts.slice(1).join('_');
    }

    return { itemId: key, variation, room };
}
