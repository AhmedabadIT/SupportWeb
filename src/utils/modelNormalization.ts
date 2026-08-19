export interface NormalizedHardware {
  model: string;
  brand: string;
  product?: string;
  category?: string;
}

/**
 * Normalizes hardware model entries and shorthand phrases.
 * - Brother HL 2080: "hl2080", "hl208080", "hl 2080", "hl2080dw", "2080dw", "2080" -> "Brother HL 2080 DW", Brand "Brother", Product "Printer"
 * - Acer 7470 / Veriton: "acer 7470", "acer z4660g", "acer veriton", "veriton 7470", "z4660g" -> "Acer Veriton Z4660G", Brand "Acer", Product "AIO"
 * - Dell Optiplex 7470: "aio 7470", "dell 7470", "dell optiplex", "optiplex 7470" -> "Dell Optiplex 7470", Brand "Dell", Product "Desktop"/"AIO"
 */
export function normalizeModelString(
  inputModel?: string,
  inputProduct?: string,
  inputBrand?: string,
  rawText?: string
): NormalizedHardware {
  const modelStr = (inputModel || '').trim();
  const prodStr = (inputProduct || '').trim();
  const brandStr = (inputBrand || '').trim();
  const rawStr = (rawText || '').trim();

  const combined = `${modelStr} ${prodStr} ${brandStr} ${rawStr}`.toLowerCase();

  // 0. Cisco Switches Match
  if (combined.includes('cisco 3750') && (combined.includes('48') || combined.includes('poe-48') || combined.includes('poe 48'))) {
    return {
      model: 'Cisco 3750 (Poe-48)',
      brand: 'Cisco',
      product: 'Switch',
      category: 'SWITCH'
    };
  }
  if (combined.includes('cisco 3750') || combined.includes('3750 poe') || combined.includes('3750 (poe-24)')) {
    return {
      model: 'Cisco 3750 (Poe-24)',
      brand: 'Cisco',
      product: 'Switch',
      category: 'SWITCH'
    };
  }
  if (combined.includes('cisco 2960') || combined.includes('2960 poe') || combined.includes('2960 (poe-24)')) {
    return {
      model: 'Cisco 2960 (Poe-24)',
      brand: 'Cisco',
      product: 'Switch',
      category: 'SWITCH'
    };
  }

  // 1. Brother DCP-B7535DW Match
  if (
    combined.includes('brother 7535') ||
    combined.includes('dcp-b7535dw') ||
    combined.includes('dcp b7535dw') ||
    combined.includes('dcp7535') ||
    combined.includes('b7535dw') ||
    combined.includes('b7535') ||
    combined.includes('7535dw') ||
    (combined.includes('brother') && combined.includes('7535')) ||
    (combined.includes('dcp') && combined.includes('7535')) ||
    combined.includes('7535')
  ) {
    return {
      model: 'Brother DCP-B7535DW',
      brand: 'Brother',
      product: 'Printer',
      category: 'PRINTER'
    };
  }

  // 2. Brother HL 2080 DW Match
  if (
    combined.includes('hl2080') ||
    combined.includes('hl 2080') ||
    combined.includes('hl-2080') ||
    combined.includes('2080dw') ||
    combined.includes('2080 dw') ||
    combined.includes('hl2080dw') ||
    combined.includes('hl208080') ||
    (combined.includes('brother') && combined.includes('2080')) ||
    (combined.includes('hl') && combined.includes('2080'))
  ) {
    return {
      model: 'Brother HL 2080 DW',
      brand: 'Brother',
      product: 'Printer',
      category: 'PRINTER'
    };
  }

  // 2. Acer Veriton Z4660G (Acer 7470) Match
  if (
    combined.includes('acer 7470') ||
    combined.includes('acer z4660g') ||
    combined.includes('veriton 7470') ||
    combined.includes('acer veriton') ||
    combined.includes('z4660g') ||
    combined.includes('veriton z4660g') ||
    (combined.includes('acer') && combined.includes('7470')) ||
    (combined.includes('acer') && combined.includes('veriton'))
  ) {
    return {
      model: 'Acer Veriton Z4660G',
      brand: 'Acer',
      product: 'AIO',
      category: 'AIO'
    };
  }

  // 3. Dell Optiplex 7470 Match
  if (
    combined.includes('aio 7470') ||
    combined.includes('dell 7470') ||
    combined.includes('dell optiplex') ||
    combined.includes('optiplex 7470') ||
    combined.includes('dell optiplex 7470') ||
    combined.includes('aio dell 7470') ||
    combined.includes('dell aio 7470') ||
    (combined.includes('optiplex') && combined.includes('7470')) ||
    (combined.includes('dell') && combined.includes('7470')) ||
    (combined.includes('aio') && combined.includes('7470'))
  ) {
    return {
      model: 'Dell Optiplex 7470',
      brand: 'Dell',
      product: 'AIO',
      category: 'AIO'
    };
  }

  let finalProduct = prodStr;
  let finalCategory = '';
  if (prodStr && prodStr.toUpperCase() === 'DESKTOP') {
    finalProduct = 'AIO';
  }

  return {
    model: modelStr,
    brand: brandStr,
    product: finalProduct,
    category: finalCategory
  };
}

/**
 * Checks if a string contains any of the hardware alias phrases that can be auto-normalized.
 */
export function getHardwareAliasSuggestion(text: string): { model: string; brand: string } | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (lower.includes('cisco 3750') && (lower.includes('48') || lower.includes('poe-48') || lower.includes('poe 48'))) {
    return { model: 'Cisco 3750 (Poe-48)', brand: 'Cisco' };
  }
  if (lower.includes('cisco 3750') || lower.includes('3750 poe') || lower.includes('3750 (poe-24)')) {
    return { model: 'Cisco 3750 (Poe-24)', brand: 'Cisco' };
  }
  if (lower.includes('cisco 2960') || lower.includes('2960 poe') || lower.includes('2960 (poe-24)')) {
    return { model: 'Cisco 2960 (Poe-24)', brand: 'Cisco' };
  }

  if (
    lower.includes('brother 7535') ||
    lower.includes('dcp-b7535dw') ||
    lower.includes('dcp b7535dw') ||
    lower.includes('dcp7535') ||
    lower.includes('b7535dw') ||
    lower.includes('b7535') ||
    lower.includes('7535dw') ||
    (lower.includes('brother') && lower.includes('7535')) ||
    (lower.includes('dcp') && lower.includes('7535')) ||
    lower.includes('7535')
  ) {
    return { model: 'Brother DCP-B7535DW', brand: 'Brother' };
  }

  if (
    lower.includes('hl2080') ||
    lower.includes('hl 2080') ||
    lower.includes('hl-2080') ||
    lower.includes('2080dw') ||
    lower.includes('2080 dw') ||
    lower.includes('hl2080dw') ||
    lower.includes('hl208080') ||
    (lower.includes('brother') && lower.includes('2080')) ||
    (lower.includes('hl') && lower.includes('2080'))
  ) {
    return { model: 'Brother HL 2080 DW', brand: 'Brother' };
  }

  if (
    lower.includes('acer 7470') ||
    lower.includes('acer z4660g') ||
    lower.includes('veriton 7470') ||
    lower.includes('acer veriton') ||
    lower.includes('z4660g') ||
    lower.includes('veriton z4660g') ||
    (lower.includes('acer') && lower.includes('7470')) ||
    (lower.includes('acer') && lower.includes('veriton'))
  ) {
    return { model: 'Acer Veriton Z4660G', brand: 'Acer' };
  }

  if (
    lower.includes('aio 7470') ||
    lower.includes('dell 7470') ||
    lower.includes('dell optiplex') ||
    lower.includes('optiplex 7470') ||
    lower.includes('dell optiplex 7470') ||
    lower.includes('aio dell 7470') ||
    lower.includes('dell aio 7470') ||
    (lower.includes('optiplex') && lower.includes('7470')) ||
    (lower.includes('dell') && lower.includes('7470')) ||
    (lower.includes('aio') && lower.includes('7470'))
  ) {
    return { model: 'Dell Optiplex 7470', brand: 'Dell' };
  }

  return null;
}

export function isOptiplex7470Match(text: string): boolean {
  if (!text) return false;
  return getHardwareAliasSuggestion(text) !== null;
}
