// Moteur d'affichage de Pure Health.
// Le gabarit (src/app.template.html) est compilé en JSON par tools/build.mjs,
// puis rendu ici avec Preact à partir des valeurs calculées par renderVals().
import { Component, h, Fragment } from 'preact';
import TEMPLATE from './generated/template.json';

export const STORAGE_KEY = 'purehealth:v1';

// État d'interface qu'on ne garde pas d'une ouverture à l'autre
const TRANSIENT = ['menuOpen', 'editing', 'editPrev', 'factIdx', 'selDay', 'selWeek', 'viewWeek', 'showInfo'];
const MAIN_STEPS = ['today', 'week', 'gains', 'bilan', 'sos'];

function lookup(scope, path) {
  const parts = path.split('.');
  let v = scope[parts[0]];
  for (let i = 1; i < parts.length; i++) {
    if (v == null) return undefined;
    v = v[parts[i]];
  }
  return v;
}

function text(v) {
  return v == null || v === false ? '' : String(v);
}

function attrValue(spec, scope) {
  if (typeof spec === 'string') return spec;
  if (spec.p !== undefined) return lookup(scope, spec.p);
  return spec.parts.map((x) => (typeof x === 'string' ? x : text(lookup(scope, x.p)))).join('');
}

function renderNodes(nodes, scope, out) {
  for (const n of nodes) {
    if (n.t !== undefined) {
      out.push(n.t.map((x) => (typeof x === 'string' ? x : text(lookup(scope, x.p)))).join(''));
    } else if (n.if !== undefined) {
      if (lookup(scope, n.if)) renderNodes(n.c, scope, out);
    } else if (n.for !== undefined) {
      const list = lookup(scope, n.for) || [];
      list.forEach((item, i) => {
        const s = Object.create(scope);
        s[n.as] = item;
        s.$index = i;
        renderNodes(n.c, s, out);
      });
    } else {
      const props = {};
      for (const k in n.a) props[k] = attrValue(n.a[k], scope);
      out.push(h(n.e, props, ...renderNodes(n.c, scope, [])));
    }
  }
  return out;
}

export function renderTemplate(vals) {
  const children = renderNodes(TEMPLATE, vals, []);
  return children.length === 1 ? children[0] : h(Fragment, null, ...children);
}

export function resetData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* stockage indisponible */ }
  location.reload();
}

// Classe de base : état React-like, sauvegarde locale automatique, rendu du gabarit.
export class DCLogic extends Component {
  componentWillMount() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        TRANSIENT.forEach((k) => { delete saved[k]; });
        if (saved.paramsLog && saved.paramsLog.length && MAIN_STEPS.indexOf(saved.step) < 0) saved.step = 'today';
        // setState (et non this.state = …) : Preact prépare l'état avant cet appel
        this.setState(saved);
      }
    } catch (e) { /* données illisibles : on repart de zéro */ }
  }

  componentDidUpdate() {
    try {
      const o = Object.assign({}, this.state);
      TRANSIENT.forEach((k) => { delete o[k]; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    } catch (e) { /* stockage plein ou désactivé */ }
  }

  render() {
    return renderTemplate(this.renderVals());
  }
}
