import {
  ConfidenceLevel,
  MappingMethod,
  MappingResultStatus,
  ParseKind,
  ParsedLineRecord,
} from '../types/intake.types';

export interface BootstrapMappingResultCandidate {
  sellableProductSku?: string;
  mappingRuleCode?: string;
  matchedProductName?: string;
  matchedSpec?: string;
  multiplier: number;
  mappedQuantity: number;
  mappingMethod: MappingMethod;
  mappingConfidence: ConfidenceLevel;
  mappingConfidenceScore: number;
  status: MappingResultStatus;
  requiresExplosion: boolean;
  ruleHitSummary?: string;
}

export function autoMapParsedLineToBootstrapResult(
  parsedLine: Pick<
    ParsedLineRecord,
    'channelCode' | 'rawProductText' | 'rawSpecText' | 'rawQuantity' | 'parseKind'
  >,
): BootstrapMappingResultCandidate {
  const context = buildContext(parsedLine);

  const governedSpecialResult = matchGovernedSpecialItem(context, parsedLine.parseKind);
  if (governedSpecialResult) {
    return finalizeCandidate(governedSpecialResult, parsedLine.rawQuantity);
  }

  const directResult =
    matchGiftBox(context) ??
    matchMadeleine(context) ??
    matchWafer(context) ??
    matchBeanTower(context) ??
    matchNutTower(context) ??
    matchSnowflake(context) ??
    matchButterCookie(context) ??
    matchWesternPastry(context) ??
    matchCrispStick(context) ??
    matchUnsaltedNuts(context) ??
    matchDateSeries(context) ??
    matchMilkCandy(context) ??
    matchPineappleCake(context) ??
    matchDoubleTower(context) ??
    matchWalnutNougat(context) ??
    matchPhoenixCake(context);

  if (directResult) {
    return finalizeCandidate(directResult, parsedLine.rawQuantity);
  }

  return finalizeCandidate(
    {
      mappingRuleCode: 'BOOTSTRAP_UNMAPPED',
      multiplier: 1,
      mappingMethod: MappingMethod.UNMAPPED,
      mappingConfidenceScore: 0,
      ruleHitSummary: '未命中 bootstrap mapping rule family',
    },
    parsedLine.rawQuantity,
  );
}

interface MappingContext {
  channelCode: string;
  productText: string;
  specText: string;
  fullText: string;
  productNoSpace: string;
  specNoSpace: string;
  fullTextNoSpace: string;
}

interface PartialMappingCandidate {
  mappingRuleCode: string;
  sellableProductSku?: string;
  matchedProductName?: string;
  matchedSpec?: string;
  multiplier?: number;
  mappingMethod?: MappingMethod;
  mappingConfidenceScore?: number;
  requiresExplosion?: boolean;
  ruleHitSummary?: string;
}

function buildContext(
  parsedLine: Pick<
    ParsedLineRecord,
    'channelCode' | 'rawProductText' | 'rawSpecText' | 'rawQuantity' | 'parseKind'
  >,
): MappingContext {
  const productText = String(parsedLine.rawProductText ?? '')
    .replace(/【艾薇手工坊】/gu, '')
    .trim();
  const specText = String(parsedLine.rawSpecText ?? '').trim();
  const fullText = `${productText} ${specText}`.trim();

  return {
    channelCode: parsedLine.channelCode,
    productText,
    specText,
    fullText,
    productNoSpace: normalizeText(productText),
    specNoSpace: normalizeText(specText),
    fullTextNoSpace: normalizeText(fullText),
  };
}

function finalizeCandidate(
  candidate: PartialMappingCandidate,
  rawQuantity: number,
): BootstrapMappingResultCandidate {
  const score = candidate.mappingConfidenceScore ?? 0;
  const multiplier = candidate.multiplier ?? 1;
  const hasProduct = Boolean(candidate.matchedProductName);

  return {
    sellableProductSku: candidate.sellableProductSku ?? resolveBootstrapSellableProductSku(candidate.matchedProductName, candidate.matchedSpec),
    mappingRuleCode: candidate.mappingRuleCode,
    matchedProductName: candidate.matchedProductName,
    matchedSpec: hasProduct ? candidate.matchedSpec : undefined,
    multiplier,
    mappedQuantity: hasProduct ? rawQuantity * multiplier : 0,
    mappingMethod: hasProduct
      ? (candidate.mappingMethod ?? MappingMethod.RULE_MATCH)
      : MappingMethod.UNMAPPED,
    mappingConfidence: score >= 0.9 ? ConfidenceLevel.HIGH : score >= 0.75 ? ConfidenceLevel.MEDIUM : ConfidenceLevel.LOW,
    mappingConfidenceScore: score,
    status: hasProduct
      ? score >= 0.9
        ? MappingResultStatus.MAPPED
        : MappingResultStatus.PENDING_MANUAL_REVIEW
      : MappingResultStatus.UNMAPPED,
    requiresExplosion: candidate.requiresExplosion ?? false,
    ruleHitSummary: candidate.ruleHitSummary,
  };
}

function matchGovernedSpecialItem(
  context: MappingContext,
  parseKind: ParseKind,
): PartialMappingCandidate | null {
  if (parseKind === ParseKind.GIFT && /^贈品:/u.test(context.productText)) {
    return {
      mappingRuleCode: 'IVY_GOVERNED_GIFT_VISIBLE',
      matchedProductName: context.productText,
      multiplier: 1,
      mappingConfidenceScore: 0.8,
      ruleHitSummary: '贈品列保留為可見治理項，不沿用 legacy 靜默忽略',
    };
  }

  if (/提袋加購/u.test(context.fullTextNoSpace)) {
    return {
      sellableProductSku: 'O00001',
      mappingRuleCode: 'IVY_SELLABLE_BAG_DIRECT',
      matchedProductName: '提袋加購',
      matchedSpec: '單入提袋',
      multiplier: 1,
      mappingConfidenceScore: 0.95,
      ruleHitSummary: '提袋加購已命中單一 active add-on SKU，底層引用 PK0014 手提夾鏈袋',
    };
  }

  const directCoffeeResult = matchSellableCoffee(context);
  if (directCoffeeResult) {
    return directCoffeeResult;
  }

  if (/濾掛(?:式)?咖啡/u.test(context.fullTextNoSpace)) {
    return {
      mappingRuleCode: 'IVY_GOVERNED_COFFEE_VISIBLE',
      matchedProductName: '濾掛式咖啡',
      multiplier: 1,
      mappingConfidenceScore: 0.8,
      ruleHitSummary: '咖啡品項保留為可見治理項',
    };
  }

  if (/運費/u.test(context.fullTextNoSpace)) {
    return {
      mappingRuleCode: 'IVY_VISIBLE_SHIPPING_UNMAPPED',
      multiplier: 1,
      mappingConfidenceScore: 0,
      ruleHitSummary: '運費不靜默忽略，但本輪不納入正式 mapping',
    };
  }

  return null;
}

function matchSellableCoffee(context: MappingContext): PartialMappingCandidate | null {
  if (!/濾掛(?:式)?咖啡|咖啡/u.test(context.fullTextNoSpace)) {
    return null;
  }

  if (/活動專用|贈品/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickCoffeeProductName(context.fullTextNoSpace);
  const matchedSpec = extractCoffeeSpec(context);

  if (!productName || !matchedSpec) {
    return null;
  }

  return {
    mappingRuleCode: 'IVY_SELLABLE_COFFEE_DIRECT',
    matchedProductName: productName,
    matchedSpec,
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.95,
    ruleHitSummary: '咖啡直售品項已命中正式商品與規格',
  };
}

function matchGiftBox(context: MappingContext): PartialMappingCandidate | null {
  if (!/禮盒/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFirstRule(context.fullTextNoSpace, [
    [/雙塔禮盒|招牌雙塔.*禮盒|招牌雙塔/u, '雙塔禮盒'],
    [/夏威夷豆塔禮盒.*(蜂蜜蔓越莓|蔓越莓)|蔓越莓禮盒/u, '蔓越莓禮盒'],
    [/夏威夷豆塔禮盒.*綜合|綜豆禮盒/u, '綜豆禮盒'],
    [/堅果塔禮盒.*綜合|綜堅禮盒/u, '綜堅禮盒'],
    [/戀戀雪花/u, '戀戀雪花禮盒'],
    [/浪漫詩篇|新浪漫詩篇/u, '浪漫詩篇禮盒'],
    [/暖暖幸福|新暖暖幸福/u, '暖暖幸福禮盒'],
    [/臻愛時光|新臻愛時光/u, '臻愛時光禮盒'],
    [/濃情滿載|新濃情滿載/u, '濃情滿載禮盒'],
    [/午後漫步|新午後漫步/u, '午後漫步禮盒'],
    [/那年花開/u, '那年花開禮盒'],
    [/花間逸韻/u, '花間逸韻禮盒'],
    [/晴空塔餅/u, '晴空塔餅禮盒'],
    [/金緻典藏/u, '輕-金緻典藏禮盒'],
    [/香榭漫遊/u, '輕-香榭漫遊禮盒'],
    [/晨曦物語/u, '輕-晨曦物語禮盒'],
    [/月光序曲/u, '輕-月光序曲禮盒'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_GIFTBOX_KEYWORD',
    matchedProductName: productName,
    matchedSpec: '禮盒',
    multiplier: 1,
    mappingConfidenceScore: 0.95,
    ruleHitSummary: '禮盒關鍵字與標準禮盒名命中',
  };
}

function matchMadeleine(context: MappingContext): PartialMappingCandidate | null {
  if (!/瑪德蓮/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const flavor = pickFlavor(context.fullTextNoSpace, [
    [/抹茶/u, '瑪德蓮-抹茶'],
    [/檸檬/u, '瑪德蓮-檸檬'],
    [/紅茶/u, '瑪德蓮-紅茶'],
    [/蜂蜜/u, '瑪德蓮-蜂蜜'],
    [/巧克力/u, '瑪德蓮-巧克力'],
    [/柑橘/u, '瑪德蓮-柑橘'],
    [/綜合|隨機/u, '瑪德蓮-綜合'],
  ]);

  if (!flavor) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_MADELEINE_FLAVOR',
    matchedProductName: flavor,
    matchedSpec: extractSpec(context, flavor),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '瑪德蓮家族與口味關鍵字命中',
  };
}

function matchWafer(context: MappingContext): PartialMappingCandidate | null {
  if (!/瓦片|杏仁瓦片/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFlavor(context.fullTextNoSpace, [
    [/原味/u, /45g/u.test(context.fullTextNoSpace) ? '瓦片-原味45克' : '瓦片-原味'],
    [/抹茶/u, '瓦片-抹茶'],
    [/紅茶/u, '瓦片-紅茶'],
    [/巧克力/u, '瓦片-巧克力'],
    [/海苔/u, '瓦片-海苔'],
    [/黑糖/u, '瓦片-黑糖'],
    [/青花椒/u, '瓦片-青花椒'],
    [/綜合/u, '瓦片-綜合'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_WAFER_FLAVOR',
    matchedProductName: productName,
    matchedSpec: productName === '瓦片-原味45克' ? undefined : extractSpec(context, productName),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: productName === '瓦片-原味45克' ? 0.95 : 0.9,
    ruleHitSummary: '瓦片家族與口味關鍵字命中',
  };
}

function matchBeanTower(context: MappingContext): PartialMappingCandidate | null {
  if (!/夏威夷豆塔|豆塔/u.test(context.fullTextNoSpace) || /禮盒/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFlavor(context.fullTextNoSpace, [
    [/蜂蜜蔓越莓|蔓越莓/u, '豆塔-蔓越莓'],
    [/焦糖/u, '豆塔-焦糖'],
    [/巧克力/u, '豆塔-巧克力'],
    [/抹茶/u, '豆塔-抹茶'],
    [/椒麻/u, '豆塔-椒麻'],
    [/綜合/u, '豆塔-綜合'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_BEAN_TOWER_FLAVOR',
    matchedProductName: productName,
    matchedSpec: extractSpec(context, productName),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '豆塔家族與口味關鍵字命中',
  };
}

function matchNutTower(context: MappingContext): PartialMappingCandidate | null {
  if (!/堅果塔/u.test(context.fullTextNoSpace) || /禮盒/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFlavor(context.fullTextNoSpace, [
    [/蜂蜜/u, '堅果塔-蜂蜜'],
    [/法式焦糖|焦糖/u, '堅果塔-焦糖'],
    [/巧克力/u, '堅果塔-巧克力'],
    [/海苔/u, '堅果塔-海苔'],
    [/咖哩/u, '堅果塔-咖哩'],
    [/綜合/u, '堅果塔-綜合'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_NUT_TOWER_FLAVOR',
    matchedProductName: productName,
    matchedSpec: extractSpec(context, productName),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '堅果塔家族與口味關鍵字命中',
  };
}

function matchSnowflake(context: MappingContext): PartialMappingCandidate | null {
  if (!/雪花餅/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFlavor(context.fullTextNoSpace, [
    [/蔓越莓/u, '雪花餅-蔓越莓'],
    [/巧克力/u, '雪花餅-巧克力'],
    [/金沙/u, '雪花餅-金沙'],
    [/抹茶/u, '雪花餅-抹茶'],
    [/肉鬆/u, '雪花餅-肉鬆'],
    [/綜合|隨機/u, '雪花餅-綜合'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_SNOWFLAKE_FLAVOR',
    matchedProductName: productName,
    matchedSpec: extractSpec(context, productName),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '雪花餅家族與口味關鍵字命中',
  };
}

function matchButterCookie(context: MappingContext): PartialMappingCandidate | null {
  if (!/奶油曲奇|奶油餅乾|經典熱銷餅乾/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFlavor(context.fullTextNoSpace, [
    [/抹茶|小山園抹茶/u, '奶油-抹茶'],
    [/焦糖牛奶/u, '奶油-焦糖牛奶'],
    [/法國巧克力|巧克力/u, '奶油-法國巧克力'],
    [/蜂蜜檸檬/u, '奶油-蜂蜜檸檬'],
    [/伯爵紅茶/u, '奶油-伯爵紅茶'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_BUTTER_COOKIE_FLAVOR',
    matchedProductName: productName,
    matchedSpec: extractSpec(context, productName),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '奶油餅乾家族與口味關鍵字命中',
  };
}

function matchWesternPastry(context: MappingContext): PartialMappingCandidate | null {
  if (!/西點餅乾|藍莓小花|咖啡小花|蔓越莓貝殼|巧克力貝殼|乳酪酥條/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFirstRule(context.fullTextNoSpace, [
    [/綜合西點|西點餅乾.*綜合|綜合/u, '西點-綜合'],
    [/乳酪酥條/u, '西點-乳酪酥條'],
    [/蔓越莓貝殼/u, '西點-蔓越莓貝殼'],
    [/藍莓小花/u, '西點-藍莓小花'],
    [/咖啡小花/u, '西點-咖啡小花'],
    [/巧克力貝殼/u, '西點-巧克力貝殼'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_WESTERN_PASTRY_KEYWORD',
    matchedProductName: productName,
    matchedSpec: extractSpec(context, productName),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '西點家族關鍵字命中',
  };
}

function matchCrispStick(context: MappingContext): PartialMappingCandidate | null {
  if (!/千層.*小酥條|小酥條/u.test(context.fullTextNoSpace)) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_CRISP_STICK_KEYWORD',
    matchedProductName: '千層-小酥條',
    matchedSpec: '小包裝',
    multiplier: 1,
    mappingConfidenceScore: 0.95,
    ruleHitSummary: '小酥條特例直接命中',
  };
}

function matchUnsaltedNuts(context: MappingContext): PartialMappingCandidate | null {
  if (!/無調味堅果|無調味/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFlavor(context.fullTextNoSpace, [
    [/綜合|原味綜合/u, '無調味綜合堅果'],
    [/核桃/u, '無調味核桃'],
    [/腰果/u, '無調味腰果'],
    [/原味杏仁|杏仁/u, '無調味杏仁'],
    [/夏威夷豆/u, '無調味夏威夷豆'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_UNSALTED_NUTS_FLAVOR',
    matchedProductName: productName,
    matchedSpec: extractSpec(context, productName),
    multiplier: extractMultiplier(context),
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '無調味堅果家族關鍵字命中',
  };
}

function matchDateSeries(context: MappingContext): PartialMappingCandidate | null {
  if (!/椰棗/u.test(context.fullTextNoSpace)) {
    return null;
  }

  const productName = pickFirstRule(context.fullTextNoSpace, [
    [/中東.*椰棗|中東椰棗/u, '★中東椰棗300g'],
    [/椰棗.*夏威夷豆|夏威夷豆.*椰棗/u, '椰棗豆子150g'],
    [/椰棗.*核桃|核桃.*椰棗/u, '椰棗核桃150g'],
    [/椰棗.*腰果|腰果.*椰棗/u, '椰棗腰果150g'],
    [/椰棗.*杏仁|杏仁.*椰棗/u, '椰棗杏仁150g'],
  ]);

  if (!productName) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_DATE_SERIES_KEYWORD',
    matchedProductName: productName,
    matchedSpec: extractSpec(context, productName),
    multiplier: 1,
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '椰棗系列關鍵字命中',
  };
}

function matchMilkCandy(context: MappingContext): PartialMappingCandidate | null {
  if (!/牛奶糖/u.test(context.fullTextNoSpace)) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_MILK_CANDY_KEYWORD',
    matchedProductName: /50g/u.test(context.fullTextNoSpace) ? '牛奶糖-50g' : '牛奶糖',
    matchedSpec: extractSpec(context, '牛奶糖'),
    multiplier: 1,
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '牛奶糖關鍵字命中',
  };
}

function matchPineappleCake(context: MappingContext): PartialMappingCandidate | null {
  if (!/土鳳梨酥|金磚土鳳梨酥/u.test(context.fullTextNoSpace)) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_PINEAPPLE_CAKE_KEYWORD',
    matchedProductName: '土鳳梨酥(紅點)',
    matchedSpec: extractSpec(context, '土鳳梨酥(紅點)'),
    multiplier: 1,
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '土鳳梨酥關鍵字命中',
  };
}

function matchDoubleTower(context: MappingContext): PartialMappingCandidate | null {
  if (!/雙塔組合|招牌雙塔組合|招牌雙塔/u.test(context.fullTextNoSpace) || /禮盒/u.test(context.fullTextNoSpace)) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_DOUBLE_TOWER_KEYWORD',
    matchedProductName: '雙塔',
    matchedSpec: extractSpec(context, '雙塔'),
    multiplier: 1,
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '雙塔組合關鍵字命中',
  };
}

function matchWalnutNougat(context: MappingContext): PartialMappingCandidate | null {
  if (!/南棗核桃糕/u.test(context.fullTextNoSpace)) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_WALNUT_NOUGAT_KEYWORD',
    matchedProductName: '南棗核桃糕',
    matchedSpec: extractSpec(context, '南棗核桃糕'),
    multiplier: 1,
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '南棗核桃糕關鍵字命中',
  };
}

function matchPhoenixCake(context: MappingContext): PartialMappingCandidate | null {
  if (!/鳳凰酥/u.test(context.fullTextNoSpace)) {
    return null;
  }

  return {
    mappingRuleCode: 'COMMON_PHOENIX_CAKE_KEYWORD',
    matchedProductName: '鳳凰酥',
    matchedSpec: extractSpec(context, '鳳凰酥'),
    multiplier: 1,
    mappingConfidenceScore: 0.9,
    ruleHitSummary: '鳳凰酥關鍵字命中',
  };
}

function extractMultiplier(context: MappingContext): number {
  const flavorTimesMatches = Array.from(
    context.fullTextNoSpace.matchAll(
      /(蜂蜜蔓越莓|蔓越莓|焦糖|巧克力|抹茶|椒麻|綜合|蜂蜜|原味|紅茶|海苔|黑糖|青花椒|金沙|肉鬆|檸檬|柑橘|咖哩)(?:口味)?(?:x|X)(\d+)/gu,
    ),
  )
    .map((match) => Number(match[2]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (flavorTimesMatches.length > 0) {
    return collapseMultiplier(flavorTimesMatches, context.fullTextNoSpace);
  }

  const multiPackMatches = Array.from(context.fullTextNoSpace.matchAll(/(?:x|X)(\d+)[包袋]/gu))
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (multiPackMatches.length > 0) {
    return collapseMultiplier(multiPackMatches, context.fullTextNoSpace);
  }

  const groupMatch = context.fullTextNoSpace.match(/(\d+)[包袋]組/u);
  if (groupMatch) {
    return Number(groupMatch[1]);
  }

  const boxMatch = context.specNoSpace.match(/^(\d+)盒/u);
  if (boxMatch) {
    return Number(boxMatch[1]);
  }

  const activityMatch = context.specNoSpace.match(/(\d+)入/u);
  if (activityMatch && /單顆|活動專用|活動/u.test(context.fullTextNoSpace)) {
    return Number(activityMatch[1]);
  }

  return 1;
}

function collapseMultiplier(values: number[], fullTextNoSpace: string): number {
  if (values.length === 1) {
    return values[0];
  }

  const hasOptionList = /單包/u.test(fullTextNoSpace) && /[&＆]/u.test(fullTextNoSpace);
  const uniqueValueCount = new Set(values).size;

  if (hasOptionList) {
    return Math.max(...values);
  }

  return uniqueValueCount >= 2 ? values.reduce((sum, value) => sum + value, 0) : Math.max(...values);
}

function resolveBootstrapSellableProductSku(
  matchedProductName?: string,
  matchedSpec?: string,
): string | undefined {
  if (!matchedProductName || !matchedSpec) {
    return undefined;
  }

  return sellableSkuLookup.get(`${normalizeLookupText(matchedProductName)}__${normalizeLookupText(matchedSpec)}`);
}

const sellableSkuLookup = new Map<string, string>([
  ['提袋加購__單入提袋', 'O00001'],
  ['咖啡-綜合__40包盒裝', 'K00040'],
  ['咖啡-綜合__60包盒裝', 'K00060'],
  ['咖啡-黃金曼巴__40包盒裝', 'K40040'],
  ['咖啡-黃金曼巴__60包盒裝', 'K40060'],
  ['咖啡-黃金曼巴__單包', 'K40001'],
  ['咖啡-日式藍山__40包盒裝', 'K20040'],
  ['咖啡-日式藍山__60包盒裝', 'K20060'],
  ['咖啡-日式藍山__單包', 'K20001'],
  ['咖啡-阿拉比卡__40包盒裝', 'K30040'],
  ['咖啡-阿拉比卡__60包盒裝', 'K30060'],
  ['咖啡-阿拉比卡__單包', 'K30001'],
  ['咖啡-巴西席拉朵日曬__40包盒裝', 'K10040'],
  ['咖啡-巴西席拉朵日曬__60包盒裝', 'K10060'],
  ['咖啡-巴西席拉朵日曬__單包', 'K10001'],
]);

function normalizeLookupText(value: string): string {
  return String(value ?? '').replace(/\s+/gu, '');
}

function pickCoffeeProductName(input: string): string | undefined {
  return pickFirstRule(input, [
    [/綜合風味|綜合\(|咖啡-綜合|咖啡-綜合/u, '咖啡 - 綜合'],
    [/黃金曼巴/u, '咖啡-黃金曼巴'],
    [/日式藍山/u, '咖啡-日式藍山'],
    [/阿拉比卡/u, '咖啡-阿拉比卡'],
    [/巴西席拉朵日曬/u, '咖啡-巴西席拉朵日曬'],
  ]);
}

function extractCoffeeSpec(context: MappingContext): string | undefined {
  if (/單包/u.test(context.fullTextNoSpace)) {
    return '單包';
  }

  const boxMatch = context.fullTextNoSpace.match(/(40|60)(?:入|包)/u);
  if (!boxMatch) {
    return undefined;
  }

  return `${boxMatch[1]}包盒裝`;
}

function extractSpec(context: MappingContext, productName: string): string | undefined {
  if (/禮盒/u.test(context.fullTextNoSpace)) {
    return '禮盒';
  }

  if (productName === '千層-小酥條') {
    return '小包裝';
  }

  if (/單顆|活動專用|活動/u.test(context.fullTextNoSpace)) {
    return '單顆';
  }

  const normalizedSpecSource = /\d+g|\d+入/u.test(context.specNoSpace)
    ? context.specNoSpace.replace(/ｇ/gu, 'g')
    : context.productNoSpace.replace(/ｇ/gu, 'g');

  const weightRules = ['300g', '280g', '200g', '150g', '135g', '120g', '90g', '60g', '50g', '45g'];
  for (const weight of weightRules) {
    if (normalizedSpecSource.includes(weight)) {
      return weight;
    }
  }

  const packRules = ['15入袋裝', '12入袋裝', '10入袋裝', '8入袋裝'];
  for (const packSpec of packRules) {
    if (normalizedSpecSource.includes(packSpec.replace(/袋裝/gu, '')) || normalizedSpecSource.includes(packSpec)) {
      return packSpec;
    }
  }

  return undefined;
}

function pickFlavor(
  input: string,
  rules: Array<[RegExp, string]>,
): string | undefined {
  return pickFirstRule(input, rules);
}

function pickFirstRule(
  input: string,
  rules: Array<[RegExp, string]>,
): string | undefined {
  for (const [pattern, value] of rules) {
    if (pattern.test(input)) {
      return value;
    }
  }

  return undefined;
}

function normalizeText(value: string): string {
  return String(value ?? '')
    .replace(/\s+/gu, '')
    .replace(/ｇ/gu, 'g')
    .replace(/[（）]/gu, (char) => (char === '（' ? '(' : ')'));
}