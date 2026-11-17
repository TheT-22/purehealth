import { DCLogic, resetData } from './runtime.js';

class Component extends DCLogic {
  constructor(props) {
    super(props);
    const t0 = new Date();
    this.state = {
      startY: t0.getFullYear(), startM: t0.getMonth(), startD: t0.getDate(),
      step: 'welcome', tabac: true, alcool: false,
      smokeFreq: 'daily', smokeDays: 7, cigsPerOcc: 10, packPrice: 12.47, cigsText: '10', packText: '12,47',
      drinkFreq: 'often', drinkDays: 4, drinksPerOcc: 3, drinkPrice: 4, drinksText: '3', priceText: '4',
      vape: false, vapeMode: 'liquid', vapeQty: 3, vapeText: '3', vapeNic: 12, nicText: '12', vapePrice: 6, vapePriceText: '6', vapeSubst: true, bottleSize: 10, bottleSizeText: '10',
      podQty: 2, podText: '2', podNic: 20, podNicText: '20', podPrice: 3, podPriceText: '3', targetPods: 0, daysPods: [0, 0, 0, 0, 0, 0, 0],
      pct: 10, targetCigs: 0, targetDrinks: 0, targetVape: 0, quitVape: false, daysVape: [0, 0, 0, 0, 0, 0, 0], daysBottles: [0, 0, 0, 0, 0, 0, 0], streakVape: 0,
      dayIdx: 0, daysCigs: [0, 0, 0, 0, 0, 0, 0], daysDrinks: [0, 0, 0, 0, 0, 0, 0],
      streakCigs: 0, streakDrinks: 0, quitTabac: false, quitAlcool: false,
      history: [], paramsLog: [], showInfo: false, simDays: 0, menuOpen: false, editing: false, editPrev: null, newBilan: false, factIdx: null, selDay: null, selWeek: null, viewWeek: null
    };
  }

  baseC() { const s = this.state; return s.cigsPerOcc * (s.smokeFreq === 'daily' ? 7 : s.smokeDays); }
  baseD() { const s = this.state; return s.drinksPerOcc * (s.drinkFreq === 'daily' ? 7 : s.drinkDays); }
  withBase() {
    const st = this.state;
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    return Object.assign({}, st, {
      baseCigs: this.baseC(), baseDrinks: this.baseD(), baseVape: st.vapeMode !== 'pods' ? st.vapeQty * 7 : 0, basePods: st.vapeMode !== 'liquid' ? st.podQty * 7 : 0,
      weekCigs: sum(st.daysCigs), weekDrinks: sum(st.daysDrinks), weekVape: Math.round(sum(st.daysVape) * 10) / 10, weekPods: sum(st.daysPods),
      todayCigs: st.daysCigs[st.dayIdx], todayDrinks: st.daysDrinks[st.dayIdx], todayVape: st.daysVape[st.dayIdx]
    });
  }

  bump(key, i, d) {
    if (i < 0) return;
    const arr = this.state[key].slice();
    arr[i] = Math.max(0, Math.round((arr[i] + d) * 10) / 10);
    const o = {}; o[key] = arr;
    this.setState(o);
  }

  edit(w, key, i, d) {
    const st = this.state;
    if (w === st.history.length) { this.bump(key, i, d); return; }
    const h = st.history.slice();
    const e = Object.assign({}, h[w]);
    const zero = [0, 0, 0, 0, 0, 0, 0];
    e.daysCigs = (e.daysCigs || zero).slice();
    e.daysDrinks = (e.daysDrinks || zero).slice();
    e.daysVape = (e.daysVape || zero).slice();
    e.daysBottles = (e.daysBottles || zero).slice();
    e.daysPods = (e.daysPods || zero).slice();
    e[key][i] = Math.max(0, Math.round((e[key][i] + d) * 10) / 10);
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    e.cigs = st.tabac ? sum(e.daysCigs) : 0;
    e.drinks = st.alcool ? sum(e.daysDrinks) : 0;
    const L = this.leadOf(w);
    e.dry = e.daysDrinks.slice(L).filter((x) => x === 0).length;
    e.smokeFree = e.daysCigs.slice(L).filter((x) => x === 0).length;
    e.vapeAmt = st.vape ? Math.round(sum(e.daysVape) * 10) / 10 : 0;
    e.podsAmt = st.vape ? sum(e.daysPods) : 0;
    e.vapeFree = e.daysVape.filter((x, i) => i >= L && x === 0 && e.daysPods[i] === 0).length;
    e.bottles = sum(e.daysBottles);
    h[w] = e;
    this.setState({ history: h });
  }

  endWeek(extra) {
    const s = this.withBase();
    const upto = (a) => a.slice(0, s.dayIdx + 1);
    const w = {
      cigs: s.tabac ? s.weekCigs : 0, drinks: s.alcool ? s.weekDrinks : 0,
      tc: s.targetCigs, td: s.targetDrinks,
      dry: upto(s.daysDrinks).filter((x) => x === 0).length,
      smokeFree: upto(s.daysCigs).filter((x) => x === 0).length,
      daysCigs: s.daysCigs.slice(), daysDrinks: s.daysDrinks.slice()
    };
    this.setState(Object.assign({
      history: s.history.concat([w]),
      targetCigs: s.quitTabac ? 0 : this.nextTarget(w.cigs, s.targetCigs),
      targetDrinks: s.quitAlcool ? 0 : this.nextTarget(w.drinks, s.targetDrinks),
      dayIdx: 0, selDay: null, selWeek: null, viewWeek: null, daysCigs: [0, 0, 0, 0, 0, 0, 0], daysDrinks: [0, 0, 0, 0, 0, 0, 0],
      step: 'bilan', showInfo: false
    }, extra || {}));
  }

  nextDay() {
    const s = this.state;
    const st = {
      streakCigs: s.daysCigs[s.dayIdx] === 0 ? s.streakCigs + 1 : 0,
      streakDrinks: s.daysDrinks[s.dayIdx] === 0 ? s.streakDrinks + 1 : 0,
      factIdx: null, selDay: null, selWeek: null, viewWeek: null
    };
    if (s.dayIdx < 6) { st.dayIdx = s.dayIdx + 1; this.setState(st); }
    else this.endWeek(st);
  }

  fillDemo() {
    const s = this.withBase();
    const spread = (total, n, start) => {
      const a = [0, 0, 0, 0, 0, 0, 0];
      for (let k = 0; k < n; k++) a[start + k] = Math.floor(total / n) + (k < total % n ? 1 : 0);
      return a;
    };
    const nc = s.smokeFreq === 'daily' ? 7 : s.smokeDays;
    const nd = s.drinkFreq === 'daily' ? 6 : s.drinkDays;
    const tc = s.quitTabac ? 0 : Math.max(0, s.targetCigs - 3);
    const td = s.quitAlcool ? 0 : Math.max(0, s.targetDrinks - 1);
    const dc = spread(tc, nc, 0), dd = spread(td, nd, 7 - nd);
    const trail = (a) => { let n = 0; for (let k = 5; k >= 0 && a[k] === 0; k--) n++; return n; };
    const sc = trail(dc), sd = trail(dd);
    this.setState({
      daysCigs: dc, daysDrinks: dd, dayIdx: 6, selDay: null, selWeek: null, viewWeek: null,
      streakCigs: sc === 6 ? s.streakCigs + 6 : sc,
      streakDrinks: sd === 6 ? s.streakDrinks + 6 : sd
    });
  }

  allFacts(s) {
    const out = [];
    const T = 'Arrêt du tabac';
    if (s.tabac) out.push(
      { tag: T, title: '20 minutes', text: 'Après ta dernière cigarette, ta tension et ton pouls redeviennent normaux.' },
      { tag: T, title: '8 heures', text: 'Tes cellules sont de nouveau normalement oxygénées.' },
      { tag: T, title: '24 heures', text: 'Plus de nicotine dans ton corps ; tes poumons commencent à évacuer le mucus et les résidus de fumée.' },
      { tag: T, title: '48 heures', text: "Le goût et l'odorat s'améliorent." },
      { tag: T, title: '72 heures', text: 'Respirer devient plus facile : tes bronches sont plus ouvertes.' },
      { tag: T, title: 'Les jours suivants', text: 'Tes cils bronchiques font remonter les goudrons : une toux passagère est normale, c’est le grand nettoyage.' },
      { tag: T, title: '2 à 10 semaines', text: 'La toux et la fatigue diminuent, tu retrouves ton souffle.' },
      { tag: T, title: '1 à 9 mois', text: "Tes bronches fonctionnent à nouveau : moins d'essoufflement à l'effort." },
      { tag: T, title: '1 an', text: "Ton risque d'infarctus est divisé par deux." },
      { tag: T, title: '5 ans', text: 'Le risque de cancer du poumon est presque divisé par deux.' },
      { tag: T, title: '10 à 15 ans', text: "Ton espérance de vie redevient celle d'une personne qui n'a jamais fumé." },
      { tag: 'Tabac', title: 'Stress', text: "Arrêter de fumer fait baisser l'anxiété et le stress, autant qu'un antidépresseur selon une grande méta-analyse." },
      { tag: 'Tabac', title: 'Chaque cigarette compte', text: 'Une cigarette évitée représente en moyenne environ 20 minutes de vie.' },
      { tag: 'Tabac', title: 'Réduire, puis arrêter', text: "Une cigarette par jour garde environ la moitié du risque cardiaque d'un paquet : chaque palier te rapproche de zéro." },
      { tag: 'Tabac', title: 'Sport', text: "Le monoxyde de carbone de la fumée prend la place de l'oxygène dans le sang. Sans cigarette, il est éliminé en 24 heures environ." }
    );
    if (s.alcool) out.push(
      { tag: 'Alcool', title: 'Sommeil', text: 'Même un ou deux verres réduisent la qualité récupératrice du sommeil.' },
      { tag: 'Alcool', title: '1 mois sans alcool', text: "Chez les buveurs réguliers, la tension, le poids et la sensibilité à l'insuline s'améliorent." },
      { tag: 'Alcool', title: 'Calories', text: 'Un verre standard apporte environ 70 kcal, avant le sucre de la boisson.' },
      { tag: 'Alcool', title: 'Muscles', text: "Beaucoup d'alcool après le sport réduit la construction musculaire d'environ un quart, même avec des protéines." },
      { tag: 'Alcool', title: 'Le lendemain', text: "Le soulagement d'un verre le soir peut se payer en anxiété le lendemain." }
    );
    if (s.vape) out.push(
      { tag: 'Vape', title: 'Le manque', text: 'Les envies de nicotine sont les plus fortes les premiers jours, puis s’atténuent nettement en 2 à 4 semaines.' },
      { tag: 'Vape', title: 'Baisser le dosage', text: 'Réduire le taux de nicotine petit à petit permet de diminuer sans ressentir un manque brutal.' },
      { tag: 'Vape', title: 'Cœur', text: 'La nicotine accélère le pouls et fait monter la tension : chaque bouffée en moins soulage ton cœur.' },
      { tag: 'Vape', title: 'Sommeil', text: 'La nicotine est un stimulant : vapoter le soir peut retarder l’endormissement.' },
      { tag: 'Vape', title: 'Moins nocive, pas inoffensive', text: 'La vape expose à bien moins de substances toxiques que la cigarette, mais la nicotine reste très addictive.' }
    );
    if (!out.length) out.push({ tag: 'Le savais-tu ?', title: 'Chaque jour compte', text: 'Réduire, même un peu, c’est déjà un progrès pour ta santé et ton budget.' });
    return out;
  }

  dailyBenefit(s) {
    if (s.tabac && s.streakCigs >= 1) {
      const steps = [
        [1, "24 h sans fumer : plus de nicotine dans ton corps, et tes poumons commencent à évacuer le mucus et les résidus de fumée."],
        [2, "48 h sans fumer : le goût et l'odorat s'améliorent."],
        [3, "72 h sans fumer : respirer devient plus facile, tes bronches sont plus ouvertes."],
        [4, "Tes cils bronchiques se remettent au travail et font remonter les goudrons : une toux passagère est normale, c'est le grand nettoyage."],
        [14, "2 semaines sans tabac : la toux et la fatigue diminuent, tu retrouves ton souffle."],
        [30, "1 mois sans tabac : tes bronches retrouvent peu à peu leur fonction, moins d'essoufflement à l'effort."],
        [365, "1 an sans tabac : ton risque d'infarctus est divisé par deux."]
      ];
      let txt = steps[0][1];
      steps.forEach((st) => { if (s.streakCigs >= st[0]) txt = st[1]; });
      return { title: s.streakCigs + (s.streakCigs > 1 ? ' jours' : ' jour') + ' sans tabac', text: txt };
    }
    if (s.alcool && s.streakDrinks >= 1) {
      return {
        title: s.streakDrinks + (s.streakDrinks > 1 ? ' jours' : ' jour') + ' sans alcool',
        text: s.streakDrinks >= 28
          ? "Un mois sans alcool : chez les buveurs réguliers, la tension, le poids et la sensibilité à l'insuline s'améliorent."
          : "Une nuit sans alcool, c'est un sommeil plus récupérateur : ton cœur se repose mieux dès les premières heures."
      };
    }
    const facts = [];
    if (s.tabac) facts.push(
      "20 minutes après une cigarette, ta tension et ton pouls redeviennent normaux.",
      "Après 8 heures sans fumer, tes cellules sont de nouveau normalement oxygénées.",
      "Arrêter de fumer fait baisser l'anxiété et le stress, autant qu'un antidépresseur selon une grande méta-analyse.",
      "Chaque cigarette évitée représente en moyenne environ 20 minutes de vie.",
      "Une cigarette par jour garde environ la moitié du risque cardiaque d'un paquet : chaque palier te rapproche de zéro."
    );
    if (s.vape) facts.push(
      { tag: 'Vape', title: 'Une aide reconnue', text: "Selon la revue Cochrane 2025, la vape avec nicotine aide davantage à arrêter de fumer que les patchs ou les gommes." },
      { tag: 'Vape', title: 'Pas sans risque', text: "Vapoter plutôt que fumer évite la combustion du tabac. Mais la vape n'est pas sans risque : à terme, l'idéal reste de s'en passer." },
      { tag: 'Vape', title: 'Baisser en douceur', text: 'Pour réduire, beaucoup commencent par le dosage : 12, puis 6, puis 3 mg, avant de passer à 0.' }
    );
    if (s.alcool) facts.push(
      "Même un ou deux verres réduisent la qualité récupératrice du sommeil.",
      "Un mois sans alcool améliore la tension, le poids et la glycémie chez les buveurs réguliers.",
      "Un verre standard apporte environ 70 kcal, avant le sucre de la boisson."
    );
    const i = (s.history.length * 7 + s.dayIdx) % facts.length;
    return { title: 'Le savais-tu ?', text: facts[i] };
  }

  pillStyle(on, compact) {
    return (compact ? 'height: 44px; padding: 0; ' : 'min-height: 48px; padding: 0 16px; text-align: left; ')
      + 'border-radius: 12px; font-size: 15px; cursor: pointer; color: #16201B; '
      + (on ? 'background: #E3F0EA; border: 2px solid #1E6F52; font-weight: 600;' : 'background: #FFFFFF; border: 2px solid #E1E4DE; font-weight: 400;');
  }

  fmtEur(n) {
    const v = n >= 100 ? String(Math.round(n)) : n.toFixed(2).replace('.', ',');
    return v + ' €';
  }

  fmtTime(m) {
    m = Math.round(m);
    if (m < 60) return m + ' min';
    if (m < 1440) {
      const h = Math.floor(m / 60), r = m % 60;
      return h + ' h ' + (r < 10 ? '0' : '') + r;
    }
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
    return d + ' j ' + h + ' h';
  }

  vapeUnitPrice(st) { return st.vapeMode === 'pods' ? st.vapePrice : st.vapePrice / 10; }
  vapeNicPerUnit(st) { return st.vapeMode === 'pods' ? st.vapeNic * 2 : st.vapeNic; }

  paramsOf(st) {
    return {
      tabac: st.tabac, alcool: st.alcool, baseCigs: st.cigsPerOcc * (st.smokeFreq === 'daily' ? 7 : st.smokeDays),
      baseDrinks: st.drinksPerOcc * (st.drinkFreq === 'daily' ? 7 : st.drinkDays), packPrice: st.packPrice, drinkPrice: st.drinkPrice,
      vape: st.vape, vapeSubst: st.vape && st.tabac && st.vapeSubst,
      liquidOn: st.vapeMode !== 'pods', podsOn: st.vapeMode !== 'liquid',
      baseVape: st.vapeQty * 7, basePods: st.podQty * 7,
      mlPrice: st.vapePrice / (st.bottleSize || 10), bottlePrice: st.vapePrice, bottleSize: st.bottleSize || 10, podPrice: st.podPrice,
      nicMl: st.vapeNic, nicPod: st.podNic * 2
    };
  }

  curParams() { return this.paramsOf(this.state); }

  // Semaines calées du lundi au dimanche : la première semaine peut commencer
  // en cours de route. Les jours d'avant le début du suivi (« lead ») sont ignorés.
  leadOf(w) { return w === 0 ? (this.state.lead || 0) : 0; }

  migrateWeeks() {
    const s = this.state;
    if (s.lead !== undefined || !s.paramsLog || !s.paramsLog.length) return null;
    const shift = (new Date(s.startY, s.startM, s.startD).getDay() + 6) % 7;
    if (!shift || s.history.length || s.dayIdx + shift > 6) return { lead: 0 };
    const mv = (a) => [0, 0, 0, 0, 0, 0, 0].slice(0, shift).concat((a || [0, 0, 0, 0, 0, 0, 0]).slice(0, 7 - shift));
    const f = (7 - shift) / 7;
    return {
      lead: shift, startD: s.startD - shift, dayIdx: s.dayIdx + shift,
      daysCigs: mv(s.daysCigs), daysDrinks: mv(s.daysDrinks), daysVape: mv(s.daysVape), daysBottles: mv(s.daysBottles), daysPods: mv(s.daysPods),
      paramsLog: s.paramsLog.map((e, i) => ({ off: i === 0 ? 0 : e.off + shift, p: e.p })),
      targetCigs: Math.round(s.targetCigs * f), targetDrinks: Math.round(s.targetDrinks * f),
      targetVape: Math.round(s.targetVape * f * 2) / 2, targetPods: Math.round(s.targetPods * f)
    };
  }

  paramsAt(off) {
    const log = this.state.paramsLog;
    if (!log || !log.length) return this.curParams();
    let p = log[0].p;
    log.forEach((e) => { if (e.off <= off) p = e.p; });
    return p;
  }

  weekGains(wi, daysC, daysD, nDays, daysV, daysB, daysP) {
    let c = 0, d = 0, mC = 0, mD = 0, tC = 0, bD = 0, wD = 0, nAl = 0, v = 0, vp = 0, mV = 0, nV = 0;
    daysV = daysV || [0, 0, 0, 0, 0, 0, 0];
    daysB = daysB || [0, 0, 0, 0, 0, 0, 0];
    daysP = daysP || [0, 0, 0, 0, 0, 0, 0];
    for (let i = this.leadOf(wi); i < nDays; i++) {
      const P = this.paramsAt(wi * 7 + i);
      if (P.vape && P.liquidOn) {
        const dv = (P.vapeSubst ? 0 : P.baseVape / 7) - (daysV[i] || 0); v += dv; nV += dv * (P.nicMl || 0);
        mV += (P.vapeSubst ? 0 : P.baseVape / 7 * (P.mlPrice || 0)) - (daysB[i] || 0) * (P.bottlePrice || 0);
      }
      if (P.vape && P.podsOn) {
        const dp = (P.vapeSubst ? 0 : P.basePods / 7) - (daysP[i] || 0); vp += dp; nV += dp * (P.nicPod || 0);
        mV += (P.vapeSubst ? 0 : P.basePods / 7 * (P.podPrice || 0)) - (daysP[i] || 0) * (P.podPrice || 0);
      }
      if (P.tabac) { const dc = P.baseCigs / 7 - (daysC[i] || 0); c += dc; mC += dc * P.packPrice / 20; tC += dc * 20; }
      if (P.alcool) { const dd = P.baseDrinks / 7 - (daysD[i] || 0); d += dd; mD += dd * P.drinkPrice; bD += P.baseDrinks / 7; wD += (daysD[i] || 0); nAl++; }
    }
    const thr = 10 * nAl / 7;
    const tD = nAl ? (Math.max(bD, thr) - Math.max(wD, thr)) * 19 : 0;
    return { c: Math.round(c), d: Math.round(d), v: Math.round(v * 10) / 10, vp: Math.round(vp), mC: mC, mD: mD, mV: mV, nV: nV, tC: tC, tD: tD, money: mC + mD + mV, minutes: tC + tD };
  }

  gainsSigned(w, wi) {
    if (w.daysCigs && wi !== undefined) return this.weekGains(wi, w.daysCigs, w.daysDrinks || [0, 0, 0, 0, 0, 0, 0], 7, w.daysVape, w.daysBottles, w.daysPods);
    return this.gainsSignedOld(w);
  }

  gainsSignedOld(w) {
    const s = this.withBase();
    const c = s.tabac ? s.baseCigs - w.cigs : 0;
    const d = s.alcool ? s.baseDrinks - w.drinks : 0;
    const dLife = s.alcool ? Math.max(s.baseDrinks, 10) - Math.max(w.drinks, 10) : 0;
    return { c: c, d: d, money: c * s.packPrice / 20 + d * s.drinkPrice, minutes: c * 20 + dLife * 19,
      mC: c * s.packPrice / 20, mD: d * s.drinkPrice, tC: c * 20, tD: dLife * 19 };
  }

  gains(w) {
    const s = this.withBase();
    const c = s.tabac ? Math.max(0, s.baseCigs - w.cigs) : 0;
    const d = s.alcool ? Math.max(0, s.baseDrinks - w.drinks) : 0;
    const dLife = s.alcool ? Math.max(0, s.baseDrinks - Math.max(w.drinks, 10)) : 0;
    return { c: c, d: d, money: c * s.packPrice / 20 + d * s.drinkPrice, minutes: c * 20 + dLife * 19 };
  }

  nextTarget(actual, target) {
    if (this.state.pct === 0) return target;
    if (actual > target) return target;
    const t = Math.round(actual * (1 - this.state.pct / 100));
    return Math.max(0, Math.min(t, actual - 1));
  }

  dateOf(w, i) { const s = this.state; return new Date(s.startY, s.startM, s.startD + 7 * w + i); }

  realOffset(sim) {
    const s = this.state;
    const now = new Date();
    const start = new Date(s.startY, s.startM, s.startD);
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today0 - start) / 864e5) + (sim || 0);
  }

  stepDay(st) {
    const n = Object.assign({}, st);
    n.streakCigs = st.daysCigs[st.dayIdx] === 0 ? st.streakCigs + 1 : 0;
    n.streakDrinks = st.daysDrinks[st.dayIdx] === 0 ? st.streakDrinks + 1 : 0;
    n.streakVape = (st.daysVape[st.dayIdx] === 0 && st.daysPods[st.dayIdx] === 0) ? st.streakVape + 1 : 0;
    if (st.dayIdx < 6) { n.dayIdx = st.dayIdx + 1; return n; }
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const L = st.history.length === 0 ? (st.lead || 0) : 0;
    const w = {
      cigs: st.tabac ? sum(st.daysCigs) : 0, drinks: st.alcool ? sum(st.daysDrinks) : 0,
      tc: st.targetCigs, td: st.targetDrinks, lead: L,
      dry: st.daysDrinks.slice(L).filter((x) => x === 0).length, smokeFree: st.daysCigs.slice(L).filter((x) => x === 0).length,
      daysCigs: st.daysCigs.slice(), daysDrinks: st.daysDrinks.slice(),
      daysVape: st.daysVape.slice(), vapeAmt: st.vape ? Math.round(sum(st.daysVape) * 10) / 10 : 0, tv: st.targetVape,
      vapeFree: st.daysVape.filter((x, i) => i >= L && x === 0 && st.daysPods[i] === 0).length,
      daysPods: st.daysPods.slice(), podsAmt: st.vape ? sum(st.daysPods) : 0, tp: st.targetPods,
      daysBottles: st.daysBottles.slice(), bottles: sum(st.daysBottles)
    };
    n.history = st.history.concat([w]);
    // Semaine de départ incomplète : on ramène les chiffres sur 7 jours avant de fixer le palier suivant
    const k = 7 / (7 - L), up = (x) => Math.round(x * k), upV = (x) => Math.round(x * k * 2) / 2;
    n.targetVape = st.quitVape ? 0 : ((st.vapeSubst && st.tabac) ? st.vapeQty * 7 : this.nextTarget(upV(w.vapeAmt), upV(st.targetVape)));
    n.targetPods = st.quitVape ? 0 : ((st.vapeSubst && st.tabac) ? st.podQty * 7 : this.nextTarget(up(w.podsAmt), up(st.targetPods)));
    n.targetCigs = st.quitTabac ? 0 : this.nextTarget(up(w.cigs), up(st.targetCigs));
    n.targetDrinks = st.quitAlcool ? 0 : this.nextTarget(up(w.drinks), up(st.targetDrinks));
    n.dayIdx = 0;
    n.daysCigs = [0, 0, 0, 0, 0, 0, 0];
    n.daysDrinks = [0, 0, 0, 0, 0, 0, 0];
    n.daysVape = [0, 0, 0, 0, 0, 0, 0];
    n.daysBottles = [0, 0, 0, 0, 0, 0, 0];
    n.daysPods = [0, 0, 0, 0, 0, 0, 0];
    n.newBilan = true;
    return n;
  }

  sync(extra) {
    let st = Object.assign({}, this.state, extra || {});
    const target = this.realOffset(st.simDays);
    let cur = st.history.length * 7 + st.dayIdx, n = 0;
    while (cur < target && n < 400) { st = this.stepDay(st); cur++; n++; }
    if (n > 0) Object.assign(st, { selDay: null, selWeek: null, viewWeek: null, factIdx: null });
    if (n > 0 || extra) this.setState(st);
  }

  componentDidMount() {
    const m = this.migrateWeeks();
    if (m) this.sync(m); else this.sync();
    this.syncTimer = setInterval(() => this.sync(), 60000);
  }

  componentWillUnmount() {
    if (this.syncTimer) clearInterval(this.syncTimer);
  }

  demoFill(s) {
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const rest = 7 - s.dayIdx;
    const spread = (arr, total, n, start) => {
      const a = arr.slice();
      for (let k = s.dayIdx; k < 7; k++) a[k] = 0;
      for (let k = 0; k < n; k++) a[start + k] = Math.floor(total / n) + (k < total % n ? 1 : 0);
      return a;
    };
    const nc = Math.max(1, s.smokeFreq === 'daily' ? rest : Math.min(s.smokeDays, rest));
    const nd = Math.max(1, s.drinkFreq === 'daily' ? Math.max(1, rest - 1) : Math.min(s.drinkDays, rest));
    const before = (a) => sum(a.slice(0, s.dayIdx));
    const tc = s.quitTabac ? 0 : Math.max(0, s.targetCigs - 3 - before(s.daysCigs));
    const td = s.quitAlcool ? 0 : Math.max(0, s.targetDrinks - 1 - before(s.daysDrinks));
    const dv = s.daysVape.slice();
    const liqOn = s.vape && s.vapeMode !== 'pods', podOn = s.vape && s.vapeMode !== 'liquid';
    const perDay = s.quitVape ? 0 : ((s.vapeSubst && s.tabac) ? s.vapeQty : Math.max(0, Math.floor(s.targetVape / 7 / 0.5) * 0.5));
    const perDayP = s.quitVape ? 0 : ((s.vapeSubst && s.tabac) ? s.podQty : Math.max(0, Math.floor(s.targetPods / 7)));
    for (let k = s.dayIdx; k < 7; k++) dv[k] = liqOn ? perDay : 0;
    const dp = s.daysPods.slice();
    for (let k = s.dayIdx; k < 7; k++) dp[k] = podOn ? perDayP : 0;
    const db = s.daysBottles.slice();
    for (let k = s.dayIdx; k < 7; k++) db[k] = 0;
    if (liqOn && perDay > 0) {
      const every = Math.max(1, Math.round((s.bottleSize || 10) / perDay));
      for (let k = s.dayIdx; k < 7; k += every) db[k] = 1;
    }
    return { daysCigs: spread(s.daysCigs, tc, nc, s.dayIdx), daysDrinks: spread(s.daysDrinks, td, nd, 7 - nd), daysVape: dv, daysBottles: db, daysPods: dp };
  }

  snapshot() {
    const s = this.state, o = {};
    ['tabac', 'alcool', 'smokeFreq', 'smokeDays', 'cigsPerOcc', 'packPrice', 'cigsText', 'packText',
     'drinkFreq', 'drinkDays', 'drinksPerOcc', 'drinkPrice', 'drinksText', 'priceText', 'pct',
     'vape', 'vapeMode', 'vapeQty', 'vapeText', 'vapeNic', 'nicText', 'vapePrice', 'vapePriceText', 'vapeSubst', 'bottleSize', 'bottleSizeText', 'podQty', 'podText', 'podNic', 'podNicText', 'podPrice', 'podPriceText'].forEach((k) => { o[k] = s[k]; });
    return o;
  }

  openEdit(step) { this.setState({ menuOpen: false, editing: true, editPrev: this.snapshot(), step: step }); }

  cancelEdit() { this.setState(Object.assign({}, this.state.editPrev || {}, { editing: false, editPrev: null, step: 'today' })); }

  finishEdit(extra) {
    const s = this.withBase(), prev = s.editPrev || {};
    const p = 1 - s.pct / 100;
    const off = s.history.length * 7 + s.dayIdx;
    const np = this.paramsOf(s);
    const log = (s.paramsLog || []).filter((e) => e.off !== off).concat([{ off: off, p: np }]).sort((x, y) => x.off - y.off);
    const o = { editing: false, editPrev: null, step: 'today', paramsLog: log };
    const f = (7 - this.leadOf(s.history.length)) / 7;
    if (s.tabac && !prev.tabac && !s.quitTabac) o.targetCigs = Math.round((s.pct === 0 ? s.baseCigs : s.baseCigs * p) * f);
    if (s.alcool && !prev.alcool && !s.quitAlcool) o.targetDrinks = Math.round((s.pct === 0 ? s.baseDrinks : s.baseDrinks * p) * f);
    const substNow = s.vape && s.tabac && s.vapeSubst, substPrev = prev.vape && prev.tabac && prev.vapeSubst;
    if (s.vape && !s.quitVape && (!prev.vape || substNow !== substPrev || prev.vapeMode !== s.vapeMode)) {
      o.targetVape = Math.round(((substNow || s.pct === 0) ? s.vapeQty * 7 : s.vapeQty * 7 * p) * f * 2) / 2;
      o.targetPods = Math.round(((substNow || s.pct === 0) ? s.podQty * 7 : s.podQty * 7 * p) * f);
    }
    this.setState(Object.assign(o, extra || {}));
  }

  go(step) { return () => this.setState({ step: step }); }

  cardStyle(on) {
    return 'display: flex; justify-content: space-between; align-items: center; min-height: 76px; padding: 14px 18px; border-radius: 18px; cursor: pointer; color: #16201B; '
      + (on ? 'background: #E3F0EA; border: 2px solid #1E6F52;' : 'background: #FFFFFF; border: 2px solid #E1E4DE;');
  }

  tabStyle(on) {
    return 'height: 44px; border: none; border-radius: 10px; font-size: 15px; cursor: pointer; '
      + (on ? 'background: #FFFFFF; color: #16201B; font-weight: 600; box-shadow: 0 1px 3px rgba(22, 32, 27, 0.14);' : 'background: transparent; color: #55605A; font-weight: 500;');
  }

  navStyle(on) {
    return 'display: flex; flex-direction: column; align-items: center; gap: 4px; min-height: 52px; padding: 6px 0; border: none; background: none; cursor: pointer; font-size: 12px; font-weight: 600; '
      + (on ? 'color: #1E6F52;' : 'color: #55605A;');
  }

  barStyle(week, target) {
    const p = target > 0 ? Math.min(100, week / target * 100) : (week > 0 ? 100 : 0);
    const col = week <= target ? '#1E6F52' : '#B4570F';
    return 'width: ' + p + '%; height: 100%; border-radius: 999px; background: ' + col + ';';
  }

  status(week, target, unit) {
    if (this.state.pct === 0 && target > 0) {
      const L = this.leadOf(this.state.history.length);
      const exp = Math.round(target * (this.state.dayIdx + 1 - L) / (7 - L)), diff = exp - week;
      return diff >= 0 ? diff + ' ' + unit + ' de moins que ton habitude à ce stade' : (-diff) + ' de plus que ton habitude à ce stade : rien de grave';
    }
    if (target === 0) return week === 0 ? 'Zéro cette semaine pour l’instant : continue comme ça' : 'Chaque jour sans compte : tu peux reprendre dès maintenant';
    if (week <= target) return 'Encore ' + (target - week) + ' ' + unit + ' avant ton palier';
    return 'Palier dépassé de ' + (week - target) + ' : pas grave, chaque ' + (unit === 'verres' ? 'verre' : 'cigarette') + ' en moins compte';
  }

  renderVals() {
    const s = this.withBase();
    const nProd = (s.tabac ? 1 : 0) + (s.alcool ? 1 : 0) + (s.vape ? 1 : 0);
    const multi = nProd >= 2;
    const fq = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
    const vUnit = 'ml';
    const liqOn = s.vape && s.vapeMode !== 'pods', podOn = s.vape && s.vapeMode !== 'liquid';
    const nicMl = s.vapeNic, nicPod = s.podNic * 2;
    const subst = s.vape && s.tabac && s.vapeSubst;
    const p = 1 - s.pct / 100;
    const hist = s.history;
    const last = hist.length ? hist[hist.length - 1] : null;
    const prev = hist.length > 1 ? hist[hist.length - 2] : null;

    let totM = 0, totMin = 0;
    hist.forEach((w) => { const g = this.gains(w); totM += g.money; totMin += g.minutes; });

    const paceDefs = [
      { pct: 5, label: 'Doux', sub: '−5 % par semaine' },
      { pct: 10, label: 'Progressif', sub: '−10 % par semaine' },
      { pct: 20, label: 'Soutenu', sub: '−20 % par semaine' },
      { pct: 0, label: 'Sans objectif', sub: 'Je note ma consommation et je vois mes gains' }
    ];
    const paces = paceDefs.map((d) => ({
      label: d.label, sub: d.sub,
      mark: s.pct === d.pct ? '✓' : '',
      pressed: s.pct === d.pct ? 'true' : 'false',
      style: this.cardStyle(s.pct === d.pct),
      pick: () => this.setState({ pct: d.pct })
    }));

    const previewRows = [];
    if (s.pct === 0) {
      previewRows.push({ label: 'Palier hebdomadaire', value: 'aucun' });
      previewRows.push({ label: 'Tes gains, calculés par rapport à', value: 'ton habitude' });
    }
    if (s.tabac && s.pct !== 0) {
      previewRows.push({ label: 'Cigarettes, semaine 1', value: Math.round(s.baseCigs * p) + ' max' });
      previewRows.push({ label: 'Cigarettes, semaine 4', value: Math.round(s.baseCigs * Math.pow(p, 4)) + ' max' });
    }
    if (s.vape && s.pct !== 0 && !subst) {
      if (liqOn) previewRows.push({ label: 'Liquide, semaine 1', value: fq(Math.round(s.vapeQty * 7 * p)) + ' ml max' });
      if (podOn) previewRows.push({ label: 'Pods, semaine 1', value: Math.round(s.podQty * 7 * p) + ' max' });
    }
    if (s.alcool && s.pct !== 0) {
      previewRows.push({ label: 'Verres, semaine 1', value: Math.round(s.baseDrinks * p) + ' max' });
      previewRows.push({ label: 'Verres, semaine 4', value: Math.round(s.baseDrinks * Math.pow(p, 4)) + ' max' });
    }

    const cigChips = [5, 10, 20].map((n) => ({ label: String(n), pick: () => this.setState({ cigsPerOcc: n, cigsText: String(n) }) }));

    const smokeFreqDefs = [
      { id: 'daily', label: 'Oui, tous les jours', days: 7 },
      { id: 'often', label: 'Plusieurs fois par semaine', days: 4 },
      { id: 'sometimes', label: 'Occasionnellement (soirées…)', days: 1 }
    ];
    const smokeFreqs = smokeFreqDefs.map((d) => ({
      label: d.label, pressed: s.smokeFreq === d.id ? 'true' : 'false',
      style: this.pillStyle(s.smokeFreq === d.id, false),
      pick: () => this.setState({ smokeFreq: d.id, smokeDays: d.days })
    }));
    const drinkFreqDefs = [
      { id: 'daily', label: 'Oui, tous les jours', days: 7 },
      { id: 'often', label: 'Plusieurs fois par semaine', days: 4 },
      { id: 'weekend', label: 'Surtout le week-end', days: 2 },
      { id: 'sometimes', label: 'Occasionnellement', days: 1 }
    ];
    const drinkFreqs = drinkFreqDefs.map((d) => ({
      label: d.label, pressed: s.drinkFreq === d.id ? 'true' : 'false',
      style: this.pillStyle(s.drinkFreq === d.id, false),
      pick: () => this.setState({ drinkFreq: d.id, drinkDays: d.days })
    }));
    const dayPills = (cur, key) => [1, 2, 3, 4, 5, 6].map((n) => ({
      label: String(n), pressed: cur === n ? 'true' : 'false',
      style: this.pillStyle(cur === n, true),
      pick: () => { const o = {}; o[key] = n; this.setState(o); }
    }));

    const smokeLabels = { daily: 'Fumeur quotidien', often: 'Fume plusieurs jours par semaine', sometimes: 'Fumeur occasionnel' };
    const drinkLabels = { daily: 'Boit tous les jours', often: 'Boit plusieurs jours par semaine', weekend: 'Boit surtout le week-end', sometimes: 'Boit occasionnellement' };
    const smokeProfile = smokeLabels[s.smokeFreq] + ' · ~' + s.cigsPerOcc + ' par jour où tu fumes';
    const drinkProfile = drinkLabels[s.drinkFreq] + ' · ~' + s.drinksPerOcc + ' verres par jour où tu bois';

    const profileTips = [];
    if (s.tabac) {
      if (s.smokeFreq === 'daily') profileTips.push({ text: 'Tabac : commence par repérer un moment de la journée sans cigarette (en voiture, après le café…) et tiens-le.' });
      else profileTips.push({ text: 'Tabac : tu ne fumes pas tous les jours. Objectif bonus : un jour de plus sans tabac par semaine.' });
    }
    if (s.alcool) {
      if (s.drinkFreq === 'daily') profileTips.push({ text: 'Alcool : Santé publique France recommande des jours sans alcool. Objectif bonus : un premier jour sans par semaine.' });
      else if (s.drinksPerOcc >= 6) profileTips.push({ text: 'Alcool : tes verres se concentrent sur peu de jours. Fixe-toi un maximum par soirée avant de sortir.' });
      else profileTips.push({ text: 'Alcool : tu as déjà des jours sans alcool. Garde-les, et réduis un peu les jours où tu bois.' });
    }
    if (s.vape) {
      profileTips.push({ text: subst ? "Vape : au début, garde un dosage suffisant pour ne pas être en manque. On baissera la vape une fois la cigarette arrêtée." : 'Vape : commence par baisser le dosage, puis la quantité.' });
    }

    let g = null, bilanLines = [];
    if (last) {
      g = this.gainsSigned(last, hist.length - 1);
      const pL = this.paramsAt((hist.length - 1) * 7 + 6);
      if (s.tabac) {
        bilanLines.push({ text: Math.abs(g.c) + (g.c >= 0 ? ' cigarettes de moins' : ' cigarettes de plus') + ' que ta consommation habituelle (' + pL.baseCigs + ')' });
        if (prev) {
          const dc = prev.cigs - last.cigs;
          bilanLines.push({ text: dc > 0 ? dc + ' cigarettes de moins que la semaine dernière' : (dc === 0 ? 'Autant que la semaine dernière : tu tiens le cap' : 'Un peu plus que la semaine dernière : ton palier ne bouge pas') });
        }
        if (s.pct !== 0) bilanLines.push({ text: last.cigs <= last.tc ? 'Palier tabac respecté' : 'Palier tabac dépassé cette fois, on garde le même' });
        if (last.smokeFree > 0) bilanLines.push({ text: last.smokeFree + (last.smokeFree > 1 ? ' jours' : ' jour') + ' sans tabac cette semaine' });
      }
      if (s.alcool) {
        bilanLines.push({ text: Math.abs(g.d) + (g.d >= 0 ? ' verres de moins' : ' verres de plus') + ' que ta consommation habituelle (' + pL.baseDrinks + '), soit environ ' + Math.abs(g.d * 70) + (g.d >= 0 ? ' kcal en moins' : ' kcal en plus') });
        if (prev) {
          const dd = prev.drinks - last.drinks;
          bilanLines.push({ text: dd > 0 ? dd + ' verres de moins que la semaine dernière' : (dd === 0 ? 'Autant de verres que la semaine dernière' : 'Un peu plus de verres que la semaine dernière : ton palier ne bouge pas') });
        }
        bilanLines.push({ text: last.drinks <= 10 ? 'Tu es dans le repère de santé publique (10 verres max par semaine)' : 'Repère de santé publique : 10 verres max par semaine' });
        bilanLines.push({ text: last.dry + (last.dry > 1 ? ' jours' : ' jour') + ' sans alcool cette semaine' + (last.dry >= 2 ? " : c'est le bon réflexe" : '') });
      }
      if (s.vape && last.daysVape) {
        const pLv = this.paramsAt((hist.length - 1) * 7 + 6);
        const parts = [];
        if (pLv.liquidOn) parts.push(fq(last.vapeAmt || 0) + ' ml (' + (last.bottles || 0) + ' flacon(s) entamé(s))');
        if (pLv.podsOn) parts.push((last.podsAmt || 0) + ' pods');
        if (pLv.vapeSubst) bilanLines.push({ text: 'Vape : ' + parts.join(' et ') + ' cette semaine, soit ' + this.fmtEur(Math.abs(g.mV || 0)) + ' déduits de tes économies sur le tabac' });
        else bilanLines.push({ text: 'Vape : ' + parts.join(' et ') + ', soit ' + Math.round(Math.abs(g.nV || 0)) + ' mg de nicotine ' + ((g.nV || 0) >= 0 ? 'en moins' : 'en plus') + ' que ton habitude' });
      }
    }

    const mkChart = (title, base, vals, color) => {
      const all = [base].concat(vals).slice(-7);
      const labels = ['Avant'].concat(vals.map((v, i) => 'S' + (i + 1))).slice(-7);
      const max = Math.max.apply(null, all.concat([1]));
      return {
        title: title,
        bars: all.map((v, i) => ({
          val: v, label: labels[i],
          style: 'width: 100%; max-width: 34px; height: ' + Math.max(4, Math.round(v / max * 100)) + 'px; border-radius: 6px 6px 2px 2px; background: ' + (labels[i] === 'Avant' ? '#C9CEC7' : color) + ';'
        }))
      };
    };
    const charts = [];
    if (last && s.tabac) charts.push(mkChart('Cigarettes par semaine', this.paramsAt(0).baseCigs, hist.map((h) => h.cigs), '#1E6F52'));
    if (last && s.alcool) charts.push(mkChart('Verres par semaine', this.paramsAt(0).baseDrinks, hist.map((h) => h.drinks), '#2F6FB0'));

    const nextTargets = [];
    if (s.tabac) nextTargets.push({ text: s.quitTabac ? 'Objectif : zéro cigarette' : (s.pct === 0 ? 'Pas d\u2019objectif fixé, tu peux en choisir un quand tu veux' : s.targetCigs + ' cigarettes maximum') });
    if (s.vape) {
      const tparts = [].concat(liqOn ? [fq(s.targetVape) + ' ml'] : [], podOn ? [s.targetPods + ' pods'] : []);
      nextTargets.push({ text: s.quitVape ? 'Vape : objectif zéro' : (subst ? 'Vape : pas d\u2019objectif tant que tu arrêtes la cigarette' : (s.pct === 0 ? 'Vape : pas d\u2019objectif fixé' : 'Vape : ' + tparts.join(' et ') + ' maximum')) });
    }
    if (s.alcool) nextTargets.push({ text: s.quitAlcool ? 'Objectif : zéro verre' : (s.pct === 0 ? 'Pas d\u2019objectif fixé, tu peux en choisir un quand tu veux' : s.targetDrinks + ' verres maximum') });

    const wdFull = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const wdShort = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const dates = [0, 1, 2, 3, 4, 5, 6].map((i) => this.dateOf(hist.length, i));
    const dayNames = dates.map((d) => wdFull[d.getDay()]);
    const fullDate = (i) => dayNames[i] + ' ' + dates[i].getDate() + ' ' + monthNames[dates[i].getMonth()];
    const curW = hist.length;
    const lead0 = this.leadOf(curW), leadAll = s.lead || 0;
    const sw = (s.selWeek === null || s.selWeek === undefined) ? curW : s.selWeek;
    const sel = sw === curW ? (s.selDay === null ? s.dayIdx : s.selDay) : s.selDay;
    const dLabel = (w, i) => { const d = this.dateOf(w, i); return wdFull[d.getDay()] + ' ' + d.getDate() + ' ' + monthNames[d.getMonth()]; };
    let selName;
    if (sw === curW) selName = sel === s.dayIdx ? "Aujourd'hui" : (sel === s.dayIdx - 1 ? 'Hier' : (sel === s.dayIdx + 1 ? 'Demain' : dayNames[sel]));
    else selName = (sw === curW - 1 && sel === 6 && s.dayIdx === 0) ? 'Hier' : wdFull[this.dateOf(sw, sel).getDay()] + ' ' + this.dateOf(sw, sel).getDate();
    const pastW = sw < curW ? hist[sw] : null;
    const zero7 = [0, 0, 0, 0, 0, 0, 0];
    const selArrC = pastW ? (pastW.daysCigs || zero7) : s.daysCigs;
    const selArrD = pastW ? (pastW.daysDrinks || zero7) : s.daysDrinks;
    const selArrV = pastW ? (pastW.daysVape || zero7) : s.daysVape;
    const selArrP = pastW ? (pastW.daysPods || zero7) : s.daysPods;
    const selArrB = pastW ? (pastW.daysBottles || zero7) : s.daysBottles;
    const vw = (s.viewWeek === null || s.viewWeek === undefined) ? sw : s.viewWeek;
    const dayPicker = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const dt = this.dateOf(vw, i);
      const on = vw === sw && i === sel, today = vw === curW && i === s.dayIdx;
      const off = vw === 0 && i < leadAll;
      return {
        letter: wdShort[dt.getDay()], num: String(dt.getDate()), selected: on ? 'true' : 'false',
        aria: dLabel(vw, i) + (today ? " (aujourd'hui)" : (off ? ' (avant le début du suivi)' : '')),
        pick: off ? () => {} : () => this.setState({ selWeek: vw, selDay: i, viewWeek: vw }),
        style: 'height: 54px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border-radius: 12px; cursor: ' + (off ? 'default' : 'pointer') + '; padding: 0; '
          + (off ? 'background: transparent; color: #B9C0BA; border: 1.5px dashed #DDE1DA;' : on ? 'background: #1E6F52; color: #FFFFFF; border: 1.5px solid #1E6F52;'
                : 'background: #FFFFFF; color: ' + (today ? '#1E6F52' : '#16201B') + '; border: 1.5px solid ' + (today ? '#1E6F52' : '#E1E4DE') + ';')
      };
    });
    const vd0 = this.dateOf(vw, 0), vd6 = this.dateOf(vw, 6);
    const viewWeekLabel = 'Semaine ' + (vw + 1) + ' · ' + vd0.getDate() + (vd0.getMonth() !== vd6.getMonth() ? ' ' + monthNames[vd0.getMonth()] : '') + ' – ' + vd6.getDate() + ' ' + monthNames[vd6.getMonth()];
    const arrowStyle = (ok) => 'width: 44px; height: 44px; padding: 0; border: none; border-radius: 12px; font-size: 24px; line-height: 1; cursor: ' + (ok ? 'pointer' : 'default') + '; '
      + (ok ? 'background: #E7EAE4; color: #1E6F52;' : 'background: #F0F2EE; color: #C9CEC8;');
    const daily = this.dailyBenefit(s);
    const facts = [];
    const personal = daily.title !== 'Le savais-tu ?';
    if (personal) facts.push({ tag: 'Aujourd’hui', title: daily.title, text: daily.text });
    this.allFacts(s).forEach((f) => facts.push(f));
    const nF = facts.length;
    const defIdx = personal ? 0 : (hist.length * 7 + s.dayIdx) % nF;
    const fIdx = s.factIdx === null ? defIdx : ((s.factIdx % nF) + nF) % nF;
    const fact = facts[fIdx];
    const quitOffers = [];
    if (s.tabac && !s.quitTabac) quitOffers.push({ label: 'Arrêter complètement le tabac', pick: () => this.setState({ quitTabac: true, targetCigs: 0 }) });
    if (s.alcool && !s.quitAlcool) quitOffers.push({
      label: s.baseDrinks >= 35 ? "Arrêter l'alcool (avec un médecin)" : "Arrêter complètement l'alcool",
      pick: () => this.setState({ quitAlcool: true, targetDrinks: 0 })
    });
    const vapeNext = s.vape && subst && s.quitTabac && s.streakCigs >= 14;
    if (s.vape && !s.quitVape && !subst) quitOffers.push({ label: 'Arrêter complètement la vape', pick: () => this.setState({ quitVape: true, targetVape: 0, targetPods: 0 }) });
    if (vapeNext) quitOffers.push({ label: 'Commencer à réduire la vape', pick: () => this.openEdit('vape') });
    const reducedPct = s.tabac && s.baseCigs > 0 ? Math.round((1 - s.targetCigs / s.baseCigs) * 100) : 0;
    const showQuitCard = quitOffers.length > 0 && (hist.length >= 3 || (s.tabac && !s.quitTabac && s.baseCigs > 0 && s.targetCigs <= s.baseCigs * 0.5));
    const quitCardText = vapeNext ? 'Bravo : déjà deux semaines sans cigarette. Quand tu te sens prêt, tu peux baisser la vape, en commençant par le dosage.' : s.tabac && !s.quitTabac && s.pct !== 0
      ? 'Ton palier est déjà ' + reducedPct + " % sous ta consommation de départ. Les plus grands bénéfices, surtout pour le cœur, viennent avec l'arrêt complet."
      : 'Quand tu te sens prêt, tu peux viser zéro, à ton rythme.';
    const dryDays = s.daysDrinks.slice(lead0, s.dayIdx).filter((x) => x === 0).length;

    const elapsed = s.dayIdx + 1;
    const expC = Math.round(s.baseCigs * (elapsed - lead0) / 7), expD = Math.round(s.baseDrinks * (elapsed - lead0) / 7);
    const wkC = s.tabac ? Math.max(0, expC - s.weekCigs) : 0;
    const wkD = s.alcool ? Math.max(0, expD - s.weekDrinks) : 0;
    const wkDLife = s.alcool ? Math.max(0, expD - Math.max(s.weekDrinks, Math.round(10 * elapsed / 7))) : 0;
    const wkMoney = wkC * s.packPrice / 20 + wkD * s.drinkPrice;
    const wkMin = wkC * 20 + wkDLife * 19;
    const cw = this.weekGains(hist.length, s.daysCigs, s.daysDrinks, elapsed, s.daysVape, s.daysBottles, s.daysPods);
    const sgC = cw.c, sgD = cw.d, sgMoney = cw.money, sgMin = cw.minutes;
    const mkImp = (v, isMoney) => {
      const pos = v >= 0, col = pos ? '#1E6F52' : '#B42318';
      return {
        value: isMoney ? this.fmtEur(Math.abs(v)) : this.fmtTime(Math.abs(v)),
        label: isMoney ? (pos ? 'économisés' : 'dépensés en plus') : (pos ? 'de vie épargnée (estimation)' : 'de vie perdue (estimation)'),
        valueStyle: "font-family: 'Space Grotesk', sans-serif; font-weight: 700; line-height: 1.1; font-size: " + (isMoney ? 32 : 24) + 'px; color: ' + col + ';',
        labelStyle: 'font-size: 15px; color: ' + col + ';'
      };
    };
    // Temps de vie : non chiffré pour la vape seule
    const weekImpact = (s.tabac || s.alcool) ? [mkImp(sgMoney, true), mkImp(sgMin, false)] : [mkImp(sgMoney, true)];
    const weekOver = sgMoney < 0 || sgMin < 0;
    let totMV = 0, totNV = 0, totV = 0;
    const totBottlesAll = hist.reduce((acc, h) => acc + (h.daysBottles || []).reduce((x, y) => x + y, 0), 0) + s.daysBottles.reduce((x, y) => x + y, 0);
    let totC = 0, totD = 0, totDry = 0, totFree = 0, totSM = 0, totSMin = 0, totMC = 0, totMD = 0, totTC = 0, totTD = 0;
    hist.forEach((w, wi) => { const g2 = this.gainsSigned(w, wi); totC += g2.c; totD += g2.d; totSM += g2.money; totSMin += g2.minutes; totMC += g2.mC; totMD += g2.mD; totMV += g2.mV || 0; totNV += g2.nV || 0; totV += g2.v || 0; totTC += g2.tC; totTD += g2.tD; totDry += w.dry || 0; totFree += w.smokeFree || 0; });
    const smokeFreeNow = s.daysCigs.slice(lead0, s.dayIdx).filter((x) => x === 0).length;
    totC += sgC; totD += sgD; totSM += sgMoney; totSMin += sgMin;
    const z7 = [0, 0, 0, 0, 0, 0, 0];
    const trailZero = (a) => { let k = 0; for (let i = a.length - 1; i >= 0 && a[i] === 0; i--) k++; return k; };
    const runC = trailZero([].concat.apply([], hist.map((h) => h.daysCigs || z7)).concat(s.daysCigs.slice(0, s.dayIdx)).slice(leadAll));
    const allBottles = [].concat.apply([], hist.map((h) => h.daysBottles || z7)).concat(s.daysBottles.slice(0, s.dayIdx + 1));
    const bIdx = []; allBottles.forEach((n, i) => { for (let k = 0; k < n; k++) bIdx.push(i); });
    let bottleInsight;
    if (bIdx.length >= 2 && bIdx[bIdx.length - 1] > bIdx[0]) {
      const mlPerDay = (bIdx.length - 1) * (s.bottleSize || 10) / (bIdx[bIdx.length - 1] - bIdx[0]);
      bottleInsight = "D'après tes flacons : environ " + fq(mlPerDay) + ' ml par jour (habitude déclarée : ' + fq(s.vapeQty) + ' ml)';
    } else if (bIdx.length >= 1) {
      bottleInsight = 'Note le prochain flacon entamé : on pourra estimer ta consommation réelle.';
    } else {
      bottleInsight = 'Note chaque flacon entamé : tes dépenses vape seront calculées sur tes achats réels.';
    }
    let totBottles = 0; allBottles.forEach((n) => { totBottles += n; });
    const comb = (a, b) => (a || z7).map((x, i) => x + ((b || z7)[i] || 0));
    const runV = trailZero([].concat.apply([], hist.map((h) => comb(h.daysVape, h.daysPods))).concat(comb(s.daysVape, s.daysPods).slice(0, s.dayIdx)).slice(leadAll));
    const runD = trailZero([].concat.apply([], hist.map((h) => h.daysDrinks || z7)).concat(s.daysDrinks.slice(0, s.dayIdx)).slice(leadAll));
    const plural = (n, one, many) => n + ' ' + (n > 1 ? many : one);
    totMV += cw.mV; totNV += cw.nV; totV += cw.v;
    totMC += cw.mC; totMD += cw.mD; totTC += cw.tC; totTD += cw.tD; totDry += dryDays; totFree += smokeFreeNow;
    const tile = (v, pos, neg) => ({
      value: String(Math.abs(v)), label: v >= 0 ? pos : neg,
      valueStyle: "font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; color: " + (v >= 0 ? '#16201B' : '#B42318') + ';'
    });
    const statTiles = [];
    if (s.tabac) {
      statTiles.push(tile(totC, 'cigarettes évitées', 'cigarettes en plus'));
      statTiles.push(tile(totFree, 'jours sans tabac', 'jours sans tabac'));
    }
    if (s.alcool) {
      statTiles.push(tile(totD, 'verres évités', 'verres en plus'));
      statTiles.push(tile(totDry, 'jours sans alcool', 'jours sans alcool'));
      statTiles.push(tile(totD * 70, 'kcal évitées', 'kcal en plus'));
    }
    if (liqOn) statTiles.push(tile(totBottlesAll, 'flacons entamés', 'flacons entamés'));
    if (s.vape && !subst) {
      statTiles.push(tile(Math.round(totNV), 'mg de nicotine en moins', 'mg de nicotine en plus'));
    }
    const hero = (money, minutes, suffix, note) => {
      const ok = money >= 0 && minutes >= 0;
      const col = (v) => ok ? '#FFFFFF' : (v >= 0 ? '#1E6F52' : '#B42318');
      const it = (v, isMoney) => ({
        value: isMoney ? this.fmtEur(Math.abs(v)) : this.fmtTime(Math.abs(v)),
        label: isMoney ? (v >= 0 ? 'économisés' : 'dépensés en plus') + suffix : (v >= 0 ? 'de vie épargnée' : 'de vie perdue') + suffix + ' (estimation)',
        valueStyle: "font-family: 'Space Grotesk', sans-serif; font-weight: 700; line-height: 1.05; font-size: " + (isMoney ? 40 : 32) + 'px; color: ' + col(v) + ';',
        labelStyle: 'font-size: 15px; color: ' + col(v) + ';'
      });
      return {
        box: 'border-radius: 22px; padding: 20px; display: flex; flex-direction: column; gap: 14px; ' + (ok ? 'background: #1E6F52;' : 'background: #FFFFFF; border: 1.5px solid #E1E4DE;'),
        headStyle: 'font-size: 14px; font-weight: 600; color: ' + (ok ? '#FFFFFF' : '#55605A') + ';',
        noteStyle: 'font-size: 14px; line-height: 1.45; color: ' + (ok ? '#FFFFFF' : '#55605A') + ';',
        note: ok ? note : (note ? note + ' ' : '') + "Les moments plus difficiles comptent aussi : c'est ton vrai parcours, et il peut remonter dès maintenant.",
        items: (s.tabac || s.alcool) ? [it(money, true), it(minutes, false)] : [it(money, true)]
      };
    };
    const allHero = hero(totSM, totSMin, '', '');
    const splitRow = (title, m, t, alcoholTime) => {
      const mc = m >= 0 ? '#1E6F52' : '#B42318', tc = t >= 0 ? '#1E6F52' : '#B42318';
      return {
        title: title,
        money: this.fmtEur(Math.abs(m)) + (m >= 0 ? ' économisés' : ' dépensés en plus'),
        moneyStyle: "font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: " + mc + ';',
        time: (alcoholTime && t === 0) ? 'Temps de vie : non chiffré sous 10 verres par semaine' : this.fmtTime(Math.abs(t)) + (t >= 0 ? ' de vie épargnée (estimation)' : ' de vie perdue (estimation)'),
        timeStyle: 'font-size: 14px; color: ' + ((alcoholTime && t === 0) ? '#55605A' : tc) + ';'
      };
    };
    const splitRows = [];
    if (s.tabac) splitRows.push(splitRow('Tabac', totMC, totTC, false));
    if (s.alcool) splitRows.push(splitRow('Alcool', totMD, totTD, true));
    if (s.vape) {
      const vr = splitRow(subst ? 'Vape (déduite des économies tabac)' : 'Vape', totMV, 0, false);
      vr.time = 'Temps de vie : non chiffré pour la vape';
      vr.timeStyle = 'font-size: 14px; color: #55605A;';
      if (subst) vr.money = this.fmtEur(Math.abs(totMV)) + ' dépensés en vape';
      splitRows.push(vr);
    }
    const gLast = last ? this.gainsSigned(last, hist.length - 1) : { money: 0, minutes: 0 };
    const weekHero = hero(gLast.money, gLast.minutes, ' cette semaine', 'Par rapport à ta consommation habituelle.');

    const dayLetters = dates.map((d) => wdShort[d.getDay()] + ' ' + d.getDate());
    // Graphique de la semaine : barres suspendues, du vert au rouge selon la consommation du jour
    // comparée à l'habitude d'un jour de consommation (ref)
    const heat = (v, ref) => {
      if (v === 0) return { bar: '#1D9E75', txt: '#0F6E56' };
      const r = v / Math.max(ref, 0.1);
      if (r < 0.5) return { bar: '#97C459', txt: '#16201B' };
      if (r < 0.8) return { bar: '#EF9F27', txt: '#16201B' };
      if (r <= 1) return { bar: '#D85A30', txt: '#16201B' };
      return { bar: '#E24B4A', txt: '#A32D2D' };
    };
    const mkWeekCard = (title, arr, base, target, goal, status, freeLabel, fmt, ref) => {
      fmt = fmt || String;
      ref = ref || base / 7;
      const week = arr.reduce((x, y) => x + y, 0);
      const max = Math.max.apply(null, [1, ref].concat(arr));
      return {
        title: title, goal: goal, total: fmt(Math.round(week * 10) / 10), status: status, freeDays: freeLabel,
        barStyle: this.barStyle(week, target),
        days: arr.map((v, i) => {
          const off = i < lead0, past = !off && (i <= s.dayIdx || v > 0), today = i === s.dayIdx;
          const c = heat(v, ref);
          let bar = 'width: 100%; max-width: 30px; flex: none; ';
          if (off) bar += 'height: 22px; border: 1.5px dashed #DDE1DA; border-top: none; border-radius: 0 0 6px 6px; box-sizing: border-box;';
          else if (!past) bar += 'height: 4px; border-radius: 0 0 3px 3px; background: #E7EAE4;';
          else bar += 'height: ' + (v === 0 ? 4 : Math.max(6, Math.round(v / max * 72))) + 'px; border-radius: 0 0 6px 6px; background: ' + c.bar + ';';
          return {
            val: past ? fmt(v) : '',
            valStyle: 'margin-top: 3px; font-size: 12px; font-weight: 600; color: ' + c.txt + ';',
            label: dayLetters[i],
            labelStyle: today ? 'font-size: 12px; font-weight: 700; color: #1E6F52' : 'font-size: 12px; color: ' + (off ? '#B9C0BA' : '#55605A'),
            barStyle: bar
          };
        })
      };
    };
    const weekCards = [];
    if (s.tabac) weekCards.push(mkWeekCard('Cigarettes', s.daysCigs, s.baseCigs, s.targetCigs,
      s.quitTabac ? 'Objectif : 0' : (s.pct === 0 ? 'Habitude : ' : 'Palier : ') + s.targetCigs,
      this.status(s.weekCigs, s.targetCigs, 'cigarettes'), 'Jours sans tabac cette semaine : ' + smokeFreeNow, null, s.cigsPerOcc));
    if (s.alcool) weekCards.push(mkWeekCard("Verres d'alcool", s.daysDrinks, s.baseDrinks, s.targetDrinks,
      s.quitAlcool ? 'Objectif : 0' : (s.pct === 0 ? 'Habitude : ' : 'Palier : ') + s.targetDrinks,
      this.status(s.weekDrinks, s.targetDrinks, 'verres'), 'Jours sans alcool cette semaine : ' + dryDays, null, s.drinksPerOcc));
    const vapeFreeNow = s.daysVape.slice(0, s.dayIdx).filter((x, i) => i >= lead0 && x === 0 && s.daysPods[i] === 0).length;
    const weekBottles = s.daysBottles.reduce((x, y) => x + y, 0);
    const weekSpendL = weekBottles * s.vapePrice, weekSpendP = s.weekPods * s.podPrice;
    const vStat = (week, target, unit) => s.quitVape ? (week === 0 ? "Zéro cette semaine pour l'instant : continue comme ça" : 'Chaque jour sans compte : tu peux reprendre dès maintenant')
      : (subst ? "Aide à l'arrêt du tabac : pas d'objectif vape pour l'instant"
      : (s.pct === 0 ? 'Pas d’objectif fixé : on suit ta consommation'
      : (target - week >= 0 ? 'Encore ' + fq(target - week) + ' ' + unit + ' avant ton palier' : 'Palier dépassé de ' + fq(week - target) + ' ' + unit + ' : pas grave')));
    const vapeStatus = liqOn ? vStat(s.weekVape, s.targetVape, 'ml') : vStat(s.weekPods, s.targetPods, 'pods');
    const vGoal = (t, unit) => s.quitVape ? 'Objectif : 0' : (subst ? 'Aide à l’arrêt' : ((s.pct === 0 ? 'Habitude : ' : 'Palier : ') + fq(t)));
    if (liqOn) weekCards.push(mkWeekCard('Vape · liquide (ml)', s.daysVape, s.vapeQty * 7, s.targetVape, vGoal(s.targetVape),
      vStat(s.weekVape, s.targetVape, 'ml'), (subst ? 'Dépensé cette semaine : ' : 'Dépenses de la semaine : ') + this.fmtEur(weekSpendL) + ' (' + plural(weekBottles, 'flacon', 'flacons') + ')', fq, s.vapeQty));
    if (podOn) weekCards.push(mkWeekCard('Vape · pods', s.daysPods, s.podQty * 7, s.targetPods, vGoal(s.targetPods),
      vStat(s.weekPods, s.targetPods, 'pods'), (subst ? 'Dépensé cette semaine : ' : 'Dépenses de la semaine : ') + this.fmtEur(weekSpendP), fq, s.podQty));

    const mkItems = (rows, streak) => rows.map((r) => {
      const ok = streak >= r[1];
      return {
        when: r[0], text: r[2], reached: ok, locked: !ok,
        whenStyle: 'font-size: 13px; font-weight: 600; color: ' + (ok ? '#1E6F52' : '#55605A'),
        textStyle: 'font-size: 14px; line-height: 1.4; color: ' + (ok ? '#16201B' : '#55605A')
      };
    });
    const benefitGroups = [];
    if (s.tabac) benefitGroups.push({
      title: "Bienfaits de l'arrêt du tabac",
      sub: s.streakCigs + (s.streakCigs > 1 ? ' jours' : ' jour') + " sans tabac d'affilée",
      items: mkItems([
        ['24 heures', 1, 'Plus de nicotine dans le corps ; les poumons commencent à évacuer mucus et résidus de fumée'],
        ['48 heures', 2, "Le goût et l'odorat s'améliorent"],
        ['72 heures', 3, "Respirer devient plus facile, les bronches s'ouvrent"],
        ['4 jours', 4, 'Les cils bronchiques font remonter les goudrons : une toux passagère est normale'],
        ['2 semaines', 14, 'La toux et la fatigue diminuent, le souffle revient'],
        ['1 mois', 30, "Les bronches retrouvent leur fonction, moins d'essoufflement à l'effort"],
        ['1 an', 365, "Risque d'infarctus divisé par deux"],
        ['10 à 15 ans', 3650, "Espérance de vie identique à celle d'un non-fumeur"]
      ], s.streakCigs)
    });
    if (s.alcool) benefitGroups.push({
      title: "Bienfaits des jours sans alcool",
      sub: s.streakDrinks + (s.streakDrinks > 1 ? ' jours' : ' jour') + " sans alcool d'affilée",
      items: mkItems([
        ['1 nuit', 1, 'Sommeil plus récupérateur : le cœur se repose mieux'],
        ['1 mois', 28, "Tension, poids et sensibilité à l'insuline s'améliorent chez les buveurs réguliers"]
      ], s.streakDrinks)
    });

    const remC = s.targetCigs - s.weekCigs, remD = s.targetDrinks - s.weekDrinks;
    const cigTodayHint = s.quitTabac
      ? (s.todayCigs === 0 ? "Objectif zéro : pour l'instant, c'est réussi" : 'Pas grave : chaque heure sans compte')
      : (s.pct === 0 ? 'Pas d\u2019objectif fixé : note simplement, on calcule tes gains' : remC >= 0 ? 'Il te reste ' + remC + ' sur ton palier de la semaine' : 'Palier de la semaine dépassé de ' + (-remC) + ' : chaque cigarette en moins compte encore');
    const drinkTodayHint = s.quitAlcool
      ? (s.todayDrinks === 0 ? "Objectif zéro : pour l'instant, c'est réussi" : 'Pas grave : demain est un nouveau jour')
      : (s.pct === 0 ? 'Pas d\u2019objectif fixé : note simplement, on calcule tes gains' : remD >= 0 ? 'Il te reste ' + remD + ' sur ton palier de la semaine' : 'Palier de la semaine dépassé de ' + (-remD) + ' : chaque verre en moins compte encore');

    const canContinue = s.tabac || s.alcool || s.vape;
    const stepList = ['choose'].concat(s.tabac ? ['tabac'] : [], s.alcool ? ['alcool'] : [], s.vape ? ['vape'] : [], ['palier']);
    const stepLab = (k, suffix) => 'ÉTAPE ' + (stepList.indexOf(k) + 1) + ' SUR ' + stepList.length + suffix;

    return {
      isWelcome: s.step === 'welcome', isChoose: s.step === 'choose', isTabac: s.step === 'tabac',
      isAlcool: s.step === 'alcool', isPalier: s.step === 'palier', isHome: s.step === 'home',
      isBilan: s.step === 'bilan', isSos: s.step === 'sos',
      showNav: ['today', 'week', 'gains', 'bilan', 'sos'].indexOf(s.step) >= 0,
      tabac: s.tabac, alcool: s.alcool, vape: !!s.vape,

      goWelcome: this.go('welcome'), goChoose: this.go('choose'), goPalier: this.go('palier'),
      goHome: this.go('home'), goBilan: this.go('bilan'), goSos: this.go('sos'),
      toggleTabac: () => this.setState({ tabac: !s.tabac }),
      toggleAlcool: () => this.setState({ alcool: !s.alcool }),
      tabacPressed: s.tabac ? 'true' : 'false', alcoolPressed: s.alcool ? 'true' : 'false',
      tabacMark: s.tabac ? '✓' : '', alcoolMark: s.alcool ? '✓' : '',
      tabacCardStyle: this.cardStyle(s.tabac), alcoolCardStyle: this.cardStyle(s.alcool),
      continueStyle: 'height: 56px; border: none; border-radius: 16px; font-size: 17px; font-weight: 600; cursor: pointer; '
        + (canContinue ? 'background: #1E6F52; color: #FFFFFF;' : 'background: #DDE1DA; color: #55605A;'),
      continueChoose: () => {
        if (!canContinue) return;
        if (!s.editing) { this.setState({ step: s.tabac ? 'tabac' : (s.alcool ? 'alcool' : 'vape') }); return; }
        const prev = s.editPrev || {};
        if (s.tabac && !prev.tabac) this.setState({ step: 'tabac' });
        else if (s.alcool && !prev.alcool) this.setState({ step: 'alcool' });
        else if (s.vape && !prev.vape) this.setState({ step: 'vape' });
        else this.finishEdit();
      },
      backFromChoose: () => { if (s.editing) this.cancelEdit(); else this.setState({ step: 'welcome' }); },
      backFromTabac: () => { if (s.editing) this.cancelEdit(); else this.setState({ step: 'choose' }); },
      nextFromAlcool: () => {
        if (!s.editing) { this.setState({ step: s.vape ? 'vape' : 'palier' }); return; }
        const prev = s.editPrev || {};
        if (s.vape && !prev.vape) this.setState({ step: 'vape' }); else this.finishEdit();
      },
      nextFromVape: () => { if (s.editing) this.finishEdit(); else this.setState({ step: 'palier' }); },
      backFromVape: () => { if (s.editing) this.cancelEdit(); else this.setState({ step: s.alcool ? 'alcool' : (s.tabac ? 'tabac' : 'choose') }); },
      isVape: s.step === 'vape',
      toggleVape: () => this.setState({ vape: !s.vape }),
      vapePressed: s.vape ? 'true' : 'false', vapeMark: s.vape ? '✓' : '', vapeChooseStyle: this.cardStyle(s.vape),
      substPills: [{ v: true, l: 'Oui' }, { v: false, l: 'Non' }].map((o) => ({ label: o.l, pressed: s.vapeSubst === o.v ? 'true' : 'false', style: this.pillStyle(s.vapeSubst === o.v, false), pick: () => this.setState({ vapeSubst: o.v }) })),
      vapeModes: [{ v: 'liquid', l: 'Liquide' }, { v: 'pods', l: 'Pods' }, { v: 'both', l: 'Les deux' }].map((o) => ({ label: o.l, pressed: s.vapeMode === o.v ? 'true' : 'false', style: this.pillStyle(s.vapeMode === o.v, false), pick: () => this.setState({ vapeMode: o.v }) })),
      vapeText: s.vapeText, nicText: s.nicText, vapePriceText: s.vapePriceText,
      podText: s.podText, podNicText: s.podNicText, podPriceText: s.podPriceText,
      bottleSizeText: s.bottleSizeText,
      setBottleSize: (e) => { const t = e.target.value.replace(/[^0-9]/g, ''); this.setState({ bottleSizeText: t, bottleSize: parseInt(t, 10) || 0 }); },
      bottleChips: [10, 30, 50, 100].map((n) => ({ label: n + ' ml', pressed: s.bottleSize === n ? 'true' : 'false', style: this.pillStyle(s.bottleSize === n, true), pick: () => this.setState({ bottleSize: n, bottleSizeText: String(n) }) })),
      bottlePriceLabel: "Prix d'un flacon de " + (s.bottleSize || 10) + ' ml (€)',
      vapeLiquidOn: s.vapeMode !== 'pods', vapePodsOn: s.vapeMode !== 'liquid',
      setPodQty: (e) => { const t = e.target.value.replace(/[^0-9]/g, ''); this.setState({ podText: t, podQty: parseInt(t, 10) || 0 }); },
      setPodNic: (e) => { const t = e.target.value.replace(/[^0-9.,]/g, ''); this.setState({ podNicText: t, podNic: parseFloat(t.replace(',', '.')) || 0 }); },
      setPodPrice: (e) => { const t = e.target.value.replace(/[^0-9.,]/g, ''); this.setState({ podPriceText: t, podPrice: parseFloat(t.replace(',', '.')) || 0 }); },
      setVapeQty: (e) => { const t = e.target.value.replace(/[^0-9.,]/g, ''); this.setState({ vapeText: t, vapeQty: parseFloat(t.replace(',', '.')) || 0 }); },
      setNic: (e) => { const t = e.target.value.replace(/[^0-9.,]/g, ''); this.setState({ nicText: t, vapeNic: parseFloat(t.replace(',', '.')) || 0 }); },
      setVapePrice: (e) => { const t = e.target.value.replace(/[^0-9.,]/g, ''); this.setState({ vapePriceText: t, vapePrice: parseFloat(t.replace(',', '.')) || 0 }); },
      vapeQtyLabel: s.vapeMode === 'pods' ? 'Pods par jour' : 'Millilitres de liquide par jour',
      vapeQtyHint: s.vapeMode === 'pods' ? 'On compte 2 ml par pod, la contenance maximale autorisée en Europe.' : 'Un flacon standard contient 10 ml. Chaque fois que tu entames un flacon, tu pourras le noter : tes dépenses seront calculées sur tes flacons réels.',
      vapePriceLabel: s.vapeMode === 'pods' ? "Prix d'un pod (€)" : "Prix d'un flacon de 10 ml (€)",
      vapeNicWeek: Math.round((s.vapeMode !== 'pods' ? s.vapeQty * 7 * nicMl : 0) + (s.vapeMode !== 'liquid' ? s.podQty * 7 * nicPod : 0)),
      vapeSubstOn: !!subst,
      editPalier: () => this.openEdit('palier'),
      backLabel: s.editing ? '← Annuler' : '← Retour',
      continueLabel: s.editing ? 'Enregistrer' : 'Continuer',
      startLabel: s.editing ? 'Enregistrer' : "C'est parti",
      stepL1: s.editing ? 'RÉGLAGES · PRODUITS SUIVIS' : stepLab('choose', ''),
      stepL2: s.editing ? 'RÉGLAGES · TABAC' : stepLab('tabac', ' · TABAC'),
      stepL3: s.editing ? 'RÉGLAGES · ALCOOL' : stepLab('alcool', ' · ALCOOL'),
      stepL4: s.editing ? 'RÉGLAGES · RYTHME' : stepLab('palier', ' · TON RYTHME'),
      stepL5: s.editing ? 'RÉGLAGES · VAPE' : stepLab('vape', ' · VAPE'),
      menuOpen: !!s.menuOpen, menuExpanded: s.menuOpen ? 'true' : 'false',
      logoBg: s.menuOpen ? '#E3F0EA' : 'transparent',
      toggleMenu: () => this.setState({ menuOpen: !s.menuOpen }),
      closeMenu: () => this.setState({ menuOpen: false }),
      appVersion: 'Version du ' + (typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'développement'),
      menuItems: (() => {
        const names = [].concat(s.tabac ? ['Tabac'] : [], s.alcool ? ['Alcool'] : [], s.vape ? ['Vape'] : []);
        const items = [{ label: 'Produits suivis', sub: names.join(', '), pick: () => this.openEdit('choose') }];
        if (s.tabac) items.push({ label: 'Mon profil tabac', sub: s.cigsPerOcc + ' par jour où je fume · ' + String(s.packPrice).replace('.', ',') + ' € le paquet', pick: () => this.openEdit('tabac') });
        if (s.alcool) items.push({ label: 'Mon profil alcool', sub: s.drinksPerOcc + ' verres par jour où je bois · ' + String(s.drinkPrice).replace('.', ',') + ' € le verre', pick: () => this.openEdit('alcool') });
        if (s.vape) items.push({ label: 'Mon profil vape', sub: [].concat(liqOn ? [fq(s.vapeQty) + ' ml/jour à ' + fq(s.vapeNic) + ' mg, flacons de ' + (s.bottleSize || 10) + ' ml'] : [], podOn ? [s.podQty + ' pods/jour à ' + fq(s.podNic) + ' mg'] : []).join(' · ') + (subst ? ' · aide à l\u2019arrêt' : ''), pick: () => this.openEdit('vape') });
        items.push({ label: 'Rythme et objectif', sub: s.pct === 0 ? 'Sans objectif' : '−' + s.pct + ' % par semaine', pick: () => this.openEdit('palier') });
        items.push({ label: 'Recommencer à zéro', sub: 'Efface toutes les données de ce téléphone', pick: () => { if (window.confirm('Effacer toutes tes données et recommencer ?')) resetData(); } });
        return items;
      })(),
      nextFromTabac: () => {
        if (!s.editing) { this.setState({ step: s.alcool ? 'alcool' : (s.vape ? 'vape' : 'palier') }); return; }
        const prev = s.editPrev || {};
        if (s.alcool && !prev.alcool) this.setState({ step: 'alcool' }); else if (s.vape && !prev.vape) this.setState({ step: 'vape' }); else this.finishEdit();
      },
      backFromAlcool: () => { if (s.editing) this.cancelEdit(); else this.setState({ step: s.tabac ? 'tabac' : 'choose' }); },
      backFromPalier: () => { if (s.editing) this.cancelEdit(); else this.setState({ step: s.vape ? 'vape' : (s.alcool ? 'alcool' : 'tabac') }); },

      baseCigs: s.baseCigs, packPrice: s.packPrice, baseDrinks: s.baseDrinks, drinkPrice: s.drinkPrice,
      cigsPerOcc: s.cigsPerOcc, drinksPerOcc: s.drinksPerOcc,
      setCigsPerOcc: (e) => { const t = e.target.value.replace(/[^0-9]/g, ''); this.setState({ cigsText: t, cigsPerOcc: parseInt(t, 10) || 0 }); },
      setPackPrice: (e) => { const t = e.target.value.replace(/[^0-9.,]/g, ''); this.setState({ packText: t, packPrice: parseFloat(t.replace(',', '.')) || 0 }); },
      setDrinksPerOcc: (e) => { const t = e.target.value.replace(/[^0-9]/g, ''); this.setState({ drinksText: t, drinksPerOcc: parseInt(t, 10) || 0 }); },
      smokeFreqs: smokeFreqs, drinkFreqs: drinkFreqs,
      smokeNotDaily: s.smokeFreq !== 'daily', drinkNotDaily: s.drinkFreq !== 'daily',
      smokeDayPills: dayPills(s.smokeDays, 'smokeDays'), drinkDayPills: dayPills(s.drinkDays, 'drinkDays'),
      cigQtyLabel: s.smokeFreq === 'daily' ? 'Cigarettes par jour' : 'Cigarettes les jours où tu fumes',
      drinkQtyLabel: s.drinkFreq === 'daily' ? 'Verres standard par jour' : 'Verres standard les jours où tu bois',
      bingeRisk: s.drinksPerOcc >= 6,
      smokeProfile: smokeProfile, drinkProfile: drinkProfile, profileTips: profileTips,
      setDrinkPrice: (e) => { const t = e.target.value.replace(/[^0-9.,]/g, ''); this.setState({ priceText: t, drinkPrice: parseFloat(t.replace(',', '.')) || 0 }); },
      cigsText: s.cigsText, packText: s.packText, drinksText: s.drinksText, priceText: s.priceText,
      cigChips: cigChips,
      heavyDrinker: s.baseDrinks >= 35,

      paces: paces, previewRows: previewRows,
      startPlan: () => {
        if (!s.editing) {
          const t0 = new Date(), L = (t0.getDay() + 6) % 7, f = (7 - L) / 7, z = () => [0, 0, 0, 0, 0, 0, 0];
          this.setState({
            startY: t0.getFullYear(), startM: t0.getMonth(), startD: t0.getDate() - L, lead: L, simDays: 0, dayIdx: L, history: [],
            daysCigs: z(), daysDrinks: z(), daysVape: z(), daysBottles: z(), daysPods: z(), streakCigs: 0, streakDrinks: 0, streakVape: 0,
            paramsLog: [{ off: 0, p: this.paramsOf(s) }], step: 'today',
            targetVape: Math.round(((subst || s.pct === 0) ? s.vapeQty * 7 : s.vapeQty * 7 * p) * f * 2) / 2,
            targetPods: Math.round(((subst || s.pct === 0) ? s.podQty * 7 : s.podQty * 7 * p) * f),
            targetCigs: Math.round((s.pct === 0 ? s.baseCigs : s.baseCigs * p) * f),
            targetDrinks: Math.round((s.pct === 0 ? s.baseDrinks : s.baseDrinks * p) * f)
          });
          return;
        }
        const refC = last ? last.cigs : s.baseCigs, refD = last ? last.drinks : s.baseDrinks;
        const o = {};
        if (!s.quitTabac) o.targetCigs = s.pct === 0 ? s.baseCigs : Math.max(0, Math.round(Math.min(refC, s.baseCigs) * p));
        if (!s.quitAlcool) o.targetDrinks = s.pct === 0 ? s.baseDrinks : Math.max(0, Math.round(Math.min(refD, s.baseDrinks) * p));
        if (s.vape && !s.quitVape) {
          o.targetVape = (subst || s.pct === 0) ? s.vapeQty * 7 : Math.max(0, Math.round(Math.min(last ? (last.vapeAmt || 0) : s.vapeQty * 7, s.vapeQty * 7) * p));
          o.targetPods = (subst || s.pct === 0) ? s.podQty * 7 : Math.max(0, Math.round(Math.min(last ? (last.podsAmt || 0) : s.podQty * 7, s.podQty * 7) * p));
        }
        this.finishEdit(o);
      },

      weekNum: hist.length + 1,
      weekCigs: s.weekCigs, weekDrinks: s.weekDrinks, todayCigs: s.todayCigs, todayDrinks: s.todayDrinks,
      targetCigs: s.targetCigs, targetDrinks: s.targetDrinks,
      cigBarStyle: pastW ? this.barStyle(pastW.cigs, pastW.tc) : this.barStyle(s.weekCigs, s.targetCigs),
      drinkBarStyle: pastW ? this.barStyle(pastW.drinks, pastW.td) : this.barStyle(s.weekDrinks, s.targetDrinks),
      cigStatus: this.status(s.weekCigs, s.targetCigs, 'cigarettes'),
      drinkStatus: this.status(s.weekDrinks, s.targetDrinks, 'verres'),
      addCig: () => this.edit(sw, 'daysCigs', sel, 1),
      removeCig: () => this.edit(sw, 'daysCigs', sel, -1),
      addDrink: () => this.edit(sw, 'daysDrinks', sel, 1),
      removeDrink: () => this.edit(sw, 'daysDrinks', sel, -1),
      selWeekNum: sw + 1, pastHint: curW > 0,
      notBoth: !multi,
      counterWrap: multi ? 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-items: stretch' : 'display: flex; flex-direction: column; gap: 16px',
      counterCard: ((liqOn && podOn && nProd === 2) ? 'grid-column: 1 / -1; ' : '') + 'background: #FFFFFF; border: 1px solid #E1E4DE; border-radius: 22px; display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 0; '
        + (multi ? 'padding: 16px 10px;' : 'padding: 20px 18px;'),
      counterNum: "font-family: 'Space Grotesk', sans-serif; font-weight: 700; line-height: 1; font-size: " + (multi ? 56 : 72) + 'px;',
      miniRow: multi ? 'display: flex; flex-direction: column; align-items: center; gap: 5px; align-self: stretch' : 'display: flex; align-items: center; gap: 8px',
      miniBarWrap: 'height: 6px; border-radius: 999px; background: #EDEFEA; overflow: hidden; ' + (multi ? 'width: 100%; max-width: 120px;' : 'width: 96px;'),
      minusBtn: 'height: 56px; border: 1.5px solid #CFD5CC; border-radius: 16px; background: #FFFFFF; font-size: 24px; color: #16201B; cursor: pointer; ' + (multi ? 'width: 48px;' : 'width: 56px;'),
      plusBtn: 'height: 56px; border: none; border-radius: 16px; background: #1E6F52; font-weight: 600; color: #FFFFFF; cursor: pointer; ' + (multi ? 'width: 64px; font-size: 26px;' : 'width: 140px; font-size: 18px;'),
      plusCigLabel: multi ? '+' : '+ 1 cigarette',
      plusDrinkLabel: multi ? '+' : '+ 1 verre',
      viewWeekLabel: viewWeekLabel,
      weekPrev: () => { if (vw > 0) this.setState({ viewWeek: vw - 1 }); },
      weekNext: () => { if (vw < curW) this.setState({ viewWeek: vw + 1 }); },
      weekPrevStyle: arrowStyle(vw > 0), weekNextStyle: arrowStyle(vw < curW),
      dayPicker: dayPicker, selTitle: selName,
      selCigs: selArrC[sel], selDrinks: selArrD[sel],
      vapeTracks: [].concat(liqOn ? [{ key: 'l' }] : [], podOn ? [{ key: 'p' }] : []).map((t, _i, all) => {
        const two = all.length === 2, liq = t.key === 'l';
        return {
          showName: two, name: liq ? 'Liquide' : 'Pods',
          num: liq ? fq(selArrV[sel] || 0) : String(selArrP[sel] || 0), unit: liq ? 'ml' : 'pods',
          numStyle: "font-family: 'Space Grotesk', sans-serif; font-weight: 700; line-height: 1; font-size: " + (two ? 44 : (multi ? 56 : 72)) + 'px;',
          minus: () => this.edit(sw, liq ? 'daysVape' : 'daysPods', sel, liq ? -0.5 : -1),
          plus: () => this.edit(sw, liq ? 'daysVape' : 'daysPods', sel, liq ? 0.5 : 1),
          minusAria: liq ? 'Retirer 0,5 ml' : 'Retirer un pod', plusAria: liq ? 'Ajouter 0,5 ml' : 'Ajouter un pod',
          plusLabel: (two || multi) ? '+' : (liq ? '+ 0,5 ml' : '+ 1 pod'),
          minusStyle: 'height: ' + (two ? 48 : 56) + 'px; width: ' + (two ? 44 : (multi ? 48 : 56)) + 'px; border: 1.5px solid #CFD5CC; border-radius: 14px; background: #FFFFFF; font-size: 22px; color: #16201B; cursor: pointer;',
          plusStyle: 'height: ' + (two ? 48 : 56) + 'px; width: ' + (two ? 56 : (multi ? 64 : 140)) + 'px; border: none; border-radius: 14px; background: #1E6F52; font-weight: 600; color: #FFFFFF; cursor: pointer; font-size: ' + ((two || multi) ? 24 : 18) + 'px;'
        };
      }),
      vapeTrackWrap: (liqOn && podOn) ? 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-self: stretch' : 'display: flex; justify-content: center',
      selVapeLabel: (sw === curW && sel === s.dayIdx) ? (multi ? 'Vape' : "Vape aujourd'hui") : 'Vape · ' + selName.toLowerCase(),
      vapeCounterCard: 'background: #FFFFFF; border: 1px solid #E1E4DE; border-radius: 22px; display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 0; '
        + (multi ? 'padding: 16px 10px;' : 'padding: 20px 18px;') + ((nProd === 3 || (liqOn && podOn)) ? ' grid-column: 1 / -1;' : ''),
      vapeBarStyle: pastW ? this.barStyle((pastW.vapeAmt || 0) * nicMl + (pastW.podsAmt || 0) * nicPod, (pastW.tv || 0) * nicMl + (pastW.tp || 0) * nicPod)
        : this.barStyle((liqOn ? s.weekVape * nicMl : 0) + (podOn ? s.weekPods * nicPod : 0), (liqOn ? s.targetVape * nicMl : 0) + (podOn ? s.targetPods * nicPod : 0)),
      vapeWeekMini: 'Semaine : ' + (pastW
        ? [].concat(liqOn ? [fq(pastW.vapeAmt || 0) + ' ml'] : [], podOn ? [(pastW.podsAmt || 0) + ' pods'] : []).join(' · ')
        : [].concat(liqOn ? [fq(s.weekVape) + (s.quitVape ? ' / 0' : (subst || s.pct === 0 ? '' : ' / ' + fq(s.targetVape))) + ' ml'] : [], podOn ? [s.weekPods + (s.quitVape ? ' / 0' : (subst || s.pct === 0 ? '' : ' / ' + s.targetPods)) + ' pods'] : []).join(' · ')),
      vapeTodayHint: vapeStatus,
      vapeNicHint: '≈ ' + Math.round((liqOn ? (selArrV[sel] || 0) * nicMl : 0) + (podOn ? (selArrP[sel] || 0) * nicPod : 0)) + ' mg de nicotine',
      addVape: () => this.edit(sw, 'daysVape', sel, s.vapeMode === 'pods' ? 1 : 0.5),
      removeVape: () => this.edit(sw, 'daysVape', sel, s.vapeMode === 'pods' ? -1 : -0.5),
      vapeLiquid: liqOn,
      selBottles: selArrB[sel] || 0,
      addBottle: () => this.edit(sw, 'daysBottles', sel, 1),
      removeBottle: () => this.edit(sw, 'daysBottles', sel, -1),
      bottleBtnLabel: nProd === 2 ? '+ Flacon' : '+ Nouveau flacon',
      bottleInsight: bottleInsight,
      plusVapeLabel: multi ? '+' : (s.vapeMode === 'pods' ? '+ 1 pod' : '+ 0,5 ml'),
      selCigLabel: (sw === curW && sel === s.dayIdx) ? (multi ? 'Cigarettes' : "Cigarettes aujourd'hui") : 'Cigarettes · ' + selName.toLowerCase(),
      selDrinkLabel: (sw === curW && sel === s.dayIdx) ? (multi ? 'Verres' : "Verres aujourd'hui") : 'Verres · ' + selName.toLowerCase(),
      addCigY: () => this.bump('daysCigs', s.dayIdx - 1, 1),
      removeCigY: () => this.bump('daysCigs', s.dayIdx - 1, -1),
      addDrinkY: () => this.bump('daysDrinks', s.dayIdx - 1, 1),
      removeDrinkY: () => this.bump('daysDrinks', s.dayIdx - 1, -1),
      fillDemo: () => this.fillDemo(),
      demoDay: () => this.sync({ simDays: this.state.simDays + 1 }),
      demoWeek: () => { const st = this.state; this.sync(Object.assign(this.demoFill(st), { simDays: st.simDays + 7 - st.dayIdx })); },
      newBilan: !!s.newBilan && hist.length > 0,
      showVapeChip: s.vape && !subst,
      vapeRunNum: String(runV), vapeRunUnit: multi ? 'j' : (runV > 1 ? 'jours sans' : 'jour sans'),
      vapeRunAria: plural(runV, 'jour', 'jours') + " sans vape d'affilée",
      vapeChipStyle: 'display: flex; align-items: center; gap: 5px; height: 40px; padding: 0 12px; border-radius: 999px; ' + (runV > 0 ? 'background: #1E6F52; color: #FFFFFF; box-shadow: 0 2px 6px rgba(30, 111, 82, 0.35);' : 'background: #FFFFFF; color: #55605A; border: 1.5px solid #CFD5CC;'),
      sosText: ((s.tabac ? 1 : 0) + (s.alcool ? 1 : 0) + (s.vape && !subst ? 1 : 0)) < 3,
      cigRunShort: runC + ' j', drinkRunShort: runD + ' j',
      cigRunNum: String(runC), drinkRunNum: String(runD),
      cigRunUnit: multi ? 'j' : (runC > 1 ? 'jours sans' : 'jour sans'),
      drinkRunUnit: multi ? 'j' : (runD > 1 ? 'jours sans' : 'jour sans'),
      cigRunAria: plural(runC, 'jour', 'jours') + " sans cigarette d'affilée",
      drinkRunAria: plural(runD, 'jour', 'jours') + " sans alcool d'affilée",
      cigChipStyle: ((n) => 'display: flex; align-items: center; gap: 5px; height: 40px; padding: 0 12px; border-radius: 999px; ' + (n > 0 ? 'background: #1E6F52; color: #FFFFFF; box-shadow: 0 2px 6px rgba(30, 111, 82, 0.35);' : 'background: #FFFFFF; color: #55605A; border: 1.5px solid #CFD5CC;'))(runC), drinkChipStyle: ((n) => 'display: flex; align-items: center; gap: 5px; height: 40px; padding: 0 12px; border-radius: 999px; ' + (n > 0 ? 'background: #1E6F52; color: #FFFFFF; box-shadow: 0 2px 6px rgba(30, 111, 82, 0.35);' : 'background: #FFFFFF; color: #55605A; border: 1.5px solid #CFD5CC;'))(runD),
      cigFreeLabel: runC > 0
        ? plural(runC, 'jour', 'jours') + " sans cigarette d'affilée" + (totFree > runC ? ' · ' + totFree + ' au total' : '')
        : (totFree > 0 ? plural(totFree, 'jour', 'jours') + ' sans cigarette au total' : 'Prochain défi : un premier jour sans cigarette'),
      drinkFreeLabel: runD > 0
        ? plural(runD, 'jour', 'jours') + " sans alcool d'affilée" + (totDry > runD ? ' · ' + totDry + ' au total' : '')
        : (totDry > 0 ? plural(totDry, 'jour', 'jours') + ' sans alcool au total' : 'Prochain défi : un premier jour sans alcool'),
      bilanNoticeTitle: hist.length ? 'Semaine ' + hist.length + ' terminée (' + this.dateOf(hist.length - 1, 0).getDate() + ' – ' + this.dateOf(hist.length - 1, 6).getDate() + ' ' + monthNames[this.dateOf(hist.length - 1, 6).getMonth()] + ')' : '',
      openBilan: () => this.setState({ step: 'bilan', newBilan: false, showInfo: false }),
      nextDay: () => this.nextDay(),
      endWeek: () => this.endWeek(),

      dayLabel: fullDate(s.dayIdx), selDateLabel: dLabel(sw, sel),
      dailyTitle: daily.title, dailyText: daily.text,
      factTag: fact.tag, factTitle: fact.title, factText: fact.text, factCount: (fIdx + 1) + ' / ' + nF,
      factPrev: () => this.setState({ factIdx: fIdx - 1 }),
      factNext: () => this.setState({ factIdx: fIdx + 1 }),
      factTouchStart: (e) => { this.touchX = e.touches && e.touches[0] ? e.touches[0].clientX : null; },
      factTouchEnd: (e) => {
        if (this.touchX === null || this.touchX === undefined || !e.changedTouches || !e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - this.touchX;
        this.touchX = null;
        if (Math.abs(dx) > 40) this.setState({ factIdx: dx < 0 ? fIdx + 1 : fIdx - 1 });
      },
      showQuitCard: showQuitCard, quitCardText: quitCardText, quitOffers: quitOffers,
      cigGoalLabel: s.quitTabac ? 'Objectif : 0' : (s.pct === 0 ? 'Habitude : ' : 'Palier : ') + s.targetCigs,
      drinkGoalLabel: s.quitAlcool ? 'Objectif : 0' : (s.pct === 0 ? 'Habitude : ' : 'Palier : ') + s.targetDrinks,
      hasYesterday: s.dayIdx > lead0,
      yCigs: s.dayIdx > 0 ? s.daysCigs[s.dayIdx - 1] : 0,
      yDrinks: s.dayIdx > 0 ? s.daysDrinks[s.dayIdx - 1] : 0,
      showSmokeStreak: s.tabac && (s.quitTabac || s.streakCigs > 0),
      smokeStreakLabel: s.streakCigs + (s.streakCigs > 1 ? ' jours' : ' jour') + ' sans tabac d’affilée',
      dryDaysLabel: 'Jours sans alcool cette semaine : ' + dryDays,
      isToday: s.step === 'today', isWeek: s.step === 'week', isGains: s.step === 'gains',
      goToday: this.go('today'), goWeek: this.go('week'), goGains: this.go('gains'),
      cigTodayHint: cigTodayHint, drinkTodayHint: drinkTodayHint,
      cigHabitHint: 'Ton habitude : environ ' + Math.round(s.baseCigs / 7) + ' par jour',
      drinkHabitHint: 'Ton habitude : environ ' + String(Math.round(s.baseDrinks / 7 * 10) / 10).replace('.', ',') + ' par jour',
      weekCards: weekCards, statTiles: statTiles, benefitGroups: benefitGroups,
      weekImpact: weekImpact, weekOver: weekOver,
      cigWeekMini: pastW ? ('Semaine ' + (sw + 1) + ' : ' + pastW.cigs + ' / ' + pastW.tc) : 'Semaine : ' + s.weekCigs + (s.quitTabac ? ' · objectif 0' : (s.pct === 0 ? ' · habitude ' + s.targetCigs : ' / ' + s.targetCigs)),
      drinkWeekMini: pastW ? ('Semaine ' + (sw + 1) + ' : ' + pastW.drinks + ' / ' + pastW.td) : 'Semaine : ' + s.weekDrinks + (s.quitAlcool ? ' · objectif 0' : (s.pct === 0 ? ' · habitude ' + s.targetDrinks : ' / ' + s.targetDrinks)),
      weekSoFar: this.fmtEur(Math.abs(sgMoney)) + (sgMoney >= 0 ? ' économisés' : ' dépensés en plus') + ((s.tabac || s.alcool) ? ' · ' + this.fmtTime(Math.abs(sgMin)) + (sgMin >= 0 ? ' de vie épargnée' : ' de vie perdue') : ''),
      weekSoFarStyle: 'font-size: 17px; font-weight: 600; color: ' + (sgMoney < 0 || sgMin < 0 ? '#B42318' : '#14513B') + ';',
      allMoney: this.fmtEur(Math.max(0, totSM)), allTime: this.fmtTime(Math.max(0, totSMin)),
      allHero: allHero, weekHero: weekHero,
      showSplit: multi, splitRows: splitRows,
      navTodayStyle: this.navStyle(s.step === 'today'),
      navWeekStyle: this.navStyle(s.step === 'week' || s.step === 'bilan'),
      navGainsStyle: this.navStyle(s.step === 'gains'),

      totalMoney: this.fmtEur(totM), totalTime: this.fmtTime(totMin),
      noHistory: !last, hasHistory: !!last,
      bilanTitle: last ? 'Bilan de la semaine ' + hist.length : 'Ton bilan',
      weekMoney: g ? this.fmtEur(g.money) : '',
      weekTime: g ? this.fmtTime(g.minutes) : '',
      bilanLines: bilanLines, charts: charts, nextTargets: nextTargets,
      showInfo: s.showInfo,
      infoLabel: s.showInfo ? 'Masquer le détail des calculs' : 'D\'où viennent ces chiffres ?',
      toggleInfo: () => this.setState({ showInfo: !s.showInfo }),

      navSosStyle: this.navStyle(s.step === 'sos'),
      tabTodayStyle: this.tabStyle(s.step === 'today'),
      tabWeekStyle: this.tabStyle(s.step === 'week' || s.step === 'bilan'),
      tabGainsStyle: this.tabStyle(s.step === 'gains'),
      tabTodaySel: s.step === 'today' ? 'true' : 'false',
      tabWeekSel: (s.step === 'week' || s.step === 'bilan') ? 'true' : 'false',
      tabGainsSel: s.step === 'gains' ? 'true' : 'false',
      sosBtnStyle: 'display: flex; align-items: center; gap: 5px; height: 44px; padding: 0 12px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer; '
        + (s.step === 'sos' ? 'background: #1E6F52; color: #FFFFFF; border: none;' : 'background: #FFFFFF; color: #1E6F52; border: 1.5px solid #CFD5CC;'),
      contentStyle: 'flex: 1; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; padding: '
        + (['today', 'week', 'gains', 'bilan', 'sos'].indexOf(s.step) >= 0 ? '20px 20px calc(env(safe-area-inset-bottom) + 32px)' : 'calc(env(safe-area-inset-top) + 24px) 20px calc(env(safe-area-inset-bottom) + 24px)') + ';'
    };
  }
}

export default Component;
