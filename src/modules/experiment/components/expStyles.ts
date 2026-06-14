export const EXP_STYLES = `
  .exp-page { max-width: 1560px; margin: 0 auto; padding: 1rem 1.25rem 3rem; color: #e8e8f0; }
  .exp-back { color: #9b7ff0; text-decoration: none; font-size: 0.82rem; }
  .exp-header h1 {
    margin: 0.3rem 0 0.1rem; font-size: 1.7rem;
    background: linear-gradient(135deg, #fff, #2fd4ff);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .exp-header__sub { margin: 0; opacity: 0.6; font-size: 0.84rem; }
  .exp-header__top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
  .exp-header__actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }
  .exp-lifecycle {
    display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem; font-size: 0.62rem; opacity: 0.55;
  }
  .exp-lifecycle span::after { content: '→'; margin: 0 0.3rem; opacity: 0.4; }
  .exp-lifecycle span:last-child::after { content: ''; }
  .exp-toolbar { display: flex; gap: 0.5rem; margin-top: 0.85rem; flex-wrap: wrap; }
  .exp-toolbar input, .exp-toolbar select {
    padding: 0.5rem 0.7rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.35); color: #fff; font-size: 0.82rem;
  }
  .exp-toolbar input { min-width: 220px; flex: 1; max-width: 360px; }
  .exp-layout { display: grid; grid-template-columns: 210px 1fr 270px; gap: 1rem; margin-top: 1rem; align-items: start; }
  @media (max-width: 1100px) { .exp-layout { grid-template-columns: 1fr; } .exp-maya { order: -1; } }
  .exp-nav { position: sticky; top: 0.75rem; max-height: calc(100vh - 1.5rem); overflow-y: auto; }
  .exp-nav__group { margin-bottom: 0.6rem; }
  .exp-nav__label { display: block; font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.4; padding: 0 0.45rem; margin-bottom: 0.15rem; }
  .exp-nav__item {
    display: block; width: 100%; text-align: left; padding: 0.36rem 0.5rem; border: none; border-radius: 7px;
    background: transparent; color: rgba(255,255,255,0.62); font-size: 0.71rem; cursor: pointer;
  }
  .exp-nav__item--active { background: rgba(47,212,255,0.15); color: #2fd4ff; }
  .exp-section { background: rgba(0,0,0,0.32); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 1.1rem 1.2rem; }
  .exp-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.65rem; }
  .exp-section h2 { margin: 0; font-size: 1.05rem; color: #2fd4ff; }
  .exp-lead { margin: 0 0 0.85rem; font-size: 0.84rem; opacity: 0.68; line-height: 1.5; }
  .exp-subhead { margin: 1rem 0 0.5rem; font-size: 0.88rem; }
  .exp-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
  .exp-kpi { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.55rem 0.65rem; }
  .exp-kpi--accent { border-color: rgba(47,212,255,0.35); background: rgba(47,212,255,0.08); }
  .exp-kpi--warn { border-color: rgba(252,129,129,0.35); background: rgba(252,129,129,0.08); }
  .exp-kpi--good { border-color: rgba(104,211,145,0.35); background: rgba(104,211,145,0.08); }
  .exp-kpi span { display: block; font-size: 0.56rem; text-transform: uppercase; opacity: 0.5; }
  .exp-kpi strong { font-size: 1.05rem; color: #2fd4ff; }
  .exp-kpi--good strong { color: #68d391; }
  .exp-kpi--warn strong { color: #fc8181; }
  .exp-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  @media (max-width: 800px) { .exp-split { grid-template-columns: 1fr; } }
  .exp-panel { background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.85rem; }
  .exp-panel h3 { margin: 0 0 0.5rem; font-size: 0.88rem; }
  .exp-pipeline { display: flex; flex-direction: column; gap: 0.3rem; }
  .exp-pipeline__row { display: grid; grid-template-columns: 130px 1fr 28px; align-items: center; gap: 0.4rem; font-size: 0.72rem; }
  .exp-pipeline__bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
  .exp-pipeline__bar div { height: 100%; background: linear-gradient(90deg, #7c3aed, #2fd4ff); border-radius: 3px; }
  .exp-mini-stats { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 0.65rem 0; }
  .exp-mini-stats span { display: block; font-size: 0.6rem; opacity: 0.5; text-transform: uppercase; }
  .exp-mini-stats strong { color: #2fd4ff; }
  .exp-table-wrap { overflow-x: auto; margin-top: 0.5rem; }
  .exp-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  .exp-table th, .exp-table td { padding: 0.5rem 0.45rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
  .exp-table th { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; }
  .exp-table td strong { display: block; }
  .exp-cell { max-width: 200px; font-size: 0.76rem; opacity: 0.85; }
  .exp-stage { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 0.12rem 0.4rem; border-radius: 5px; background: rgba(255,255,255,0.08); white-space: nowrap; }
  .exp-stage--validation-ready { background: rgba(104,211,145,0.2); color: #68d391; }
  .exp-stage--running, .exp-stage--data-collection { background: rgba(47,212,255,0.15); color: #2fd4ff; }
  .exp-stage--review, .exp-stage--analysis { background: rgba(155,127,240,0.15); color: #9b7ff0; }
  .exp-muted { display: block; font-size: 0.68rem; opacity: 0.5; }
  .exp-actions { display: flex; gap: 0.55rem; flex-wrap: wrap; }
  .exp-link { color: #9b7ff0; text-decoration: none; font-size: 0.78rem; }
  .exp-link:hover { text-decoration: underline; }
  .exp-empty { padding: 1rem; text-align: center; background: rgba(0,0,0,0.2); border-radius: 10px; }
  .exp-empty p { margin: 0 0 0.5rem; opacity: 0.7; }
  .exp-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.65rem; }
  .exp-card { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem; font-size: 0.82rem; }
  .exp-card__head { display: flex; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.4rem; align-items: flex-start; }
  .exp-card label { display: block; font-size: 0.62rem; text-transform: uppercase; opacity: 0.5; margin-top: 0.45rem; }
  .exp-card p { margin: 0.2rem 0 0; opacity: 0.8; line-height: 1.45; }
  .exp-hypothesis { font-style: italic; opacity: 0.9; margin: 0.35rem 0 0.5rem; }
  .exp-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.5rem 0; }
  .exp-mini span { display: block; font-size: 0.6rem; opacity: 0.5; text-transform: uppercase; }
  .exp-links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.55rem; }
  .exp-link-card { display: block; padding: 0.8rem; border-radius: 10px; background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.07); text-decoration: none; color: inherit; }
  .exp-link-card strong { display: block; color: #2fd4ff; margin-bottom: 0.15rem; }
  .exp-link-card span { font-size: 0.72rem; opacity: 0.6; }
  .exp-kanban { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
  .exp-kanban__col { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.5rem; min-height: 120px; }
  .exp-kanban__head { display: flex; justify-content: space-between; font-size: 0.65rem; text-transform: uppercase; opacity: 0.6; margin-bottom: 0.4rem; }
  .exp-kanban__card {
    display: block; padding: 0.45rem 0.5rem; margin-bottom: 0.35rem; border-radius: 7px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    text-decoration: none; color: inherit; font-size: 0.72rem;
  }
  .exp-kanban__card strong { display: block; margin-bottom: 0.15rem; }
  .exp-kanban__card span { opacity: 0.5; font-size: 0.62rem; }
  .exp-bottleneck { padding: 0.5rem 0.65rem; border-radius: 8px; margin-bottom: 0.35rem; font-size: 0.74rem; border: 1px solid rgba(255,255,255,0.06); }
  .exp-bottleneck--high { border-color: rgba(252,129,129,0.4); background: rgba(252,129,129,0.08); }
  .exp-bottleneck--medium { border-color: rgba(246,201,14,0.35); background: rgba(246,201,14,0.06); }
  .exp-checklist { list-style: none; margin: 0; padding: 0; }
  .exp-checklist li { padding: 0.35rem 0; font-size: 0.8rem; display: flex; gap: 0.4rem; align-items: center; }
  .exp-checklist li::before { content: '○'; opacity: 0.4; }
  .exp-checklist li.exp-check--ok::before { content: '✓'; color: #68d391; opacity: 1; }
  .exp-decision { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 5px; font-size: 0.65rem; font-weight: 700; }
  .exp-decision--pass { background: rgba(104,211,145,0.2); color: #68d391; }
  .exp-decision--hold { background: rgba(246,201,14,0.15); color: #f6c90e; }
  .exp-decision--fail { background: rgba(252,129,129,0.15); color: #fc8181; }
  .exp-bar-chart { display: flex; align-items: flex-end; gap: 0.35rem; height: 80px; margin: 0.75rem 0; }
  .exp-bar-chart__col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
  .exp-bar-chart__bar { width: 100%; background: linear-gradient(180deg, #2fd4ff, #7c3aed); border-radius: 4px 4px 0 0; min-height: 4px; }
  .exp-bar-chart__label { font-size: 0.55rem; opacity: 0.5; text-align: center; }
  .exp-tree { border-left: 2px solid rgba(47,212,255,0.25); padding-left: 0.75rem; margin-bottom: 1rem; }
  .exp-tree__head { font-size: 0.88rem; margin-bottom: 0.4rem; color: #2fd4ff; }
  .exp-tree__item { font-size: 0.76rem; padding: 0.25rem 0; opacity: 0.85; }
  .exp-maya {
    position: sticky; top: 0.75rem; padding: 1rem; border-radius: 14px;
    background: linear-gradient(160deg, rgba(47,212,255,0.1), rgba(124,95,230,0.08));
    border: 1px solid rgba(47,212,255,0.25); font-size: 0.78rem;
  }
  .exp-maya__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
  .exp-maya__head strong { color: #2fd4ff; }
  .exp-maya__head span { font-size: 1.1rem; font-weight: 700; color: #68d391; }
  .exp-maya__label { margin: 0 0 0.65rem; font-size: 0.65rem; opacity: 0.5; text-transform: uppercase; }
  .exp-maya__block { margin-bottom: 0.6rem; }
  .exp-maya__block label { display: block; font-size: 0.58rem; text-transform: uppercase; opacity: 0.5; margin-bottom: 0.2rem; }
  .exp-maya__block ul { margin: 0; padding-left: 1rem; line-height: 1.45; opacity: 0.85; }
  .exp-maya__action { margin: 0.5rem 0; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 0.74rem; }
  .exp-maya-btn { display: block; width: 100%; margin-top: 0.35rem; padding: 0.42rem; border-radius: 20px; text-align: center; text-decoration: none; font-size: 0.72rem; font-weight: 600;
    background: rgba(47,212,255,0.2); border: 1px solid rgba(47,212,255,0.35); color: #2fd4ff; box-sizing: border-box; }
  .exp-maya-btn--ghost { background: transparent; border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); }
  .exp-btn { padding: 0.42rem 0.85rem; border-radius: 20px; font-weight: 600; font-size: 0.76rem; border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
  .exp-btn--ghost { background: rgba(255,255,255,0.07); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
  .exp-btn--primary { background: linear-gradient(135deg, #7c3aed, #2fd4ff); color: #fff; }
  .exp-banner { padding: 0.6rem 0.85rem; border-radius: 10px; margin-top: 0.65rem; font-size: 0.82rem; }
  .exp-banner--error { background: rgba(252,129,129,0.12); color: #fc8181; border: 1px solid rgba(252,129,129,0.3); }
  .exp-loading { width: 40px; height: 40px; margin: 4rem auto; border: 3px solid rgba(47,212,255,0.2); border-top-color: #2fd4ff; border-radius: 50%; animation: exp-spin 0.8s linear infinite; }
  .exp-error { color: #fc8181; }
  .exp-chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; }
  @media (max-width: 800px) { .exp-chart-row { grid-template-columns: 1fr; } }
  .exp-chart-card { background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.75rem; }
  .exp-chart-card h3 { margin: 0 0 0.5rem; font-size: 0.82rem; }
  @keyframes exp-spin { to { transform: rotate(360deg); } }
`;

export const EXP_DETAIL_STYLES = `
  .expd-field { display: block; margin-bottom: 0.75rem; }
  .expd-field > span { display: block; font-size: 0.62rem; text-transform: uppercase; opacity: 0.5; margin-bottom: 0.25rem; }
  .expd-field__input {
    width: 100%; box-sizing: border-box; padding: 0.55rem 0.65rem; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.35); color: #fff;
    font-size: 0.82rem; font-family: inherit; resize: vertical;
  }
  .expd-stepper { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
  .expd-step {
    display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.55rem; border-radius: 8px;
    background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); font-size: 0.68rem; opacity: 0.55;
  }
  .expd-step--done { opacity: 0.85; border-color: rgba(104,211,145,0.3); }
  .expd-step--active { opacity: 1; border-color: rgba(47,212,255,0.45); background: rgba(47,212,255,0.08); }
  .expd-step__dot {
    width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 0.6rem; background: rgba(255,255,255,0.1);
  }
  .expd-step--done .expd-step__dot { background: rgba(104,211,145,0.35); color: #68d391; }
  .expd-step--active .expd-step__dot { background: rgba(47,212,255,0.35); color: #2fd4ff; }
  .exp-header h1 { font-size: 1.5rem; }
`;
