/* @ds-bundle: {"format":4,"namespace":"DesignSystem_9512d8","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"SkyScene","sourcePath":"components/brand/SkyScene.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ICON_ALIASES","sourcePath":"components/core/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/core/Icon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/display/Avatar.jsx"},{"name":"STATUS_TONES","sourcePath":"components/display/Badge.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"CardHeader","sourcePath":"components/display/Card.jsx"},{"name":"Chip","sourcePath":"components/display/Chip.jsx"},{"name":"MemberCard","sourcePath":"components/display/MemberCard.jsx"},{"name":"ScenarioCard","sourcePath":"components/display/ScenarioCard.jsx"},{"name":"ScheduleCard","sourcePath":"components/display/ScheduleCard.jsx"},{"name":"SessionCard","sourcePath":"components/display/SessionCard.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"SkeletonCard","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ToastStack","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"DateInput","sourcePath":"components/forms/DateInput.jsx"},{"name":"FormField","sourcePath":"components/forms/FormField.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"GlobalNav","sourcePath":"components/navigation/GlobalNav.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"2eeeb431621d","components/brand/SkyScene.jsx":"4a2c75268454","components/core/Button.jsx":"1fcae6ef5502","components/core/Icon.jsx":"363ead04fd78","components/core/IconButton.jsx":"176edc0cb19d","components/display/Avatar.jsx":"f368d2494dd3","components/display/Badge.jsx":"1510bc1f7264","components/display/Card.jsx":"53f2a0da527c","components/display/Chip.jsx":"4f19abbb43e0","components/display/MemberCard.jsx":"ebfd3bf0ce02","components/display/ScenarioCard.jsx":"68de39227f51","components/display/ScheduleCard.jsx":"251e40bc80ce","components/display/SessionCard.jsx":"dd0697835401","components/feedback/Alert.jsx":"f7415b4c267c","components/feedback/Dialog.jsx":"cb1dd9b28e9d","components/feedback/EmptyState.jsx":"2c824a799d36","components/feedback/Modal.jsx":"76c6c30824e1","components/feedback/Skeleton.jsx":"61a8daba8f47","components/feedback/Spinner.jsx":"db75555f434a","components/feedback/Toast.jsx":"7f174c312698","components/feedback/Tooltip.jsx":"ce0252f96e78","components/forms/Checkbox.jsx":"eb186fa519af","components/forms/DateInput.jsx":"42e83f1a436f","components/forms/FormField.jsx":"a63a7519286a","components/forms/Radio.jsx":"d1010ef1d2ba","components/forms/Select.jsx":"ae930c2860ad","components/forms/Switch.jsx":"c140e73a7571","components/forms/TextInput.jsx":"edd7d9656d02","components/forms/Textarea.jsx":"2419e8e87368","components/navigation/Breadcrumb.jsx":"6d3ee326d212","components/navigation/GlobalNav.jsx":"5ebde9cb45e2","components/navigation/Pagination.jsx":"b559136989b6","components/navigation/Tabs.jsx":"aa3c702ec8a4","ui_kits/taku-biyori-app/App.jsx":"752e7233dc8c","ui_kits/taku-biyori-app/HomeScreen.jsx":"b31dd2771984","ui_kits/taku-biyori-app/ScenarioScreen.jsx":"e890e29550a5","ui_kits/taku-biyori-app/ScheduleScreen.jsx":"997cbfbae546","ui_kits/taku-biyori-app/SessionDetailScreen.jsx":"fdfefbbefc51","ui_kits/taku-biyori-app/SessionListScreen.jsx":"c0bca144d47d","ui_kits/taku-biyori-app/data.jsx":"03c78a3fafd6"},"inlinedExternals":[],"unexposedExports":[{"name":"fieldChrome","sourcePath":"components/forms/TextInput.jsx"}]} */

(() => {

const __ds_ns = (window.DesignSystem_9512d8 = window.DesignSystem_9512d8 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* No brand logo file was supplied, so the mark is typographic:
   the name set in the display face, with a small sun dot standing in for 日. */
function Logo({
  size = 24,
  variant = 'full',
  tone = 'auto',
  style,
  ...rest
}) {
  const color = tone === 'inverse' ? 'var(--text-inverse)' : tone === 'primary' ? 'var(--primary)' : 'var(--text-primary)';
  const dot = size * 0.34;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.34,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '0.04em',
      color,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: size * 1.34,
      height: size * 1.34,
      flex: 'none',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--sky-scene)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px rgb(18 37 58 / 0.08)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '22%',
      right: '20%',
      width: dot,
      height: dot,
      borderRadius: '50%',
      background: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '-10%',
      bottom: '-34%',
      width: '90%',
      height: '62%',
      borderRadius: 'var(--radius-full)',
      background: 'var(--ink-0)',
      opacity: 0.9
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '34%',
      bottom: '-22%',
      width: '76%',
      height: '52%',
      borderRadius: 'var(--radius-full)',
      background: 'var(--ink-0)',
      opacity: 0.72
    }
  })), variant === 'full' && /*#__PURE__*/React.createElement("span", null, "\u305F\u304F\u65E5\u548C"));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/brand/SkyScene.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Abstract sky band — the one piece of brand imagery. Day in light mode,
   the same sky at night in dark mode. Built from gradients and soft shapes,
   deliberately empty so copy can sit on top. */
function SkyScene({
  height = 200,
  radius = 'var(--radius-card)',
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      height,
      borderRadius: radius,
      overflow: 'hidden',
      background: 'var(--sky-scene)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--sky-scene-glow)'
    }
  }), /*#__PURE__*/React.createElement(Cloud, {
    left: "6%",
    top: "26%",
    w: 132,
    o: 0.92
  }), /*#__PURE__*/React.createElement(Cloud, {
    left: "52%",
    top: "12%",
    w: 90,
    o: 0.7
  }), /*#__PURE__*/React.createElement(Cloud, {
    left: "72%",
    top: "52%",
    w: 168,
    o: 0.6
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 'auto 0 0 0',
      height: '34%',
      background: 'linear-gradient(180deg, transparent, color-mix(in oklab, var(--background) 70%, transparent))'
    }
  }), children != null && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '100%'
    }
  }, children));
}
function Cloud({
  left,
  top,
  w,
  o
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left,
      top,
      width: w,
      height: w * 0.34,
      opacity: o
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 'auto 0 0 0',
      height: '54%',
      borderRadius: 'var(--radius-full)',
      background: 'var(--ink-0)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '18%',
      top: 0,
      width: '44%',
      height: '86%',
      borderRadius: '50%',
      background: 'var(--ink-0)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '46%',
      top: '18%',
      width: '34%',
      height: '66%',
      borderRadius: '50%',
      background: 'var(--ink-0)'
    }
  }));
}
Object.assign(__ds_scope, { SkyScene });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SkyScene.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Line-icon glyph data copied from Lucide (ISC licensed) — assets/icons/*.svg.
   Uniform 24x24 grid, 1.75 stroke, round caps/joins. */
const PATHS = {
  'arrow-right': '<path d="M5 12h14"></path> <path d="m12 5 7 7-7 7"></path>',
  'bell': '<path d="M10.268 21a2 2 0 0 0 3.464 0"></path> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>',
  'book-open': '<path d="M12 5v16"></path> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"></path>',
  'calendar': '<path d="M8 2v3"></path> <path d="M16 2v3"></path> <rect x="3" y="3" width="18" height="18" rx="2"></rect> <path d="M3 9h18"></path>',
  'calendar-clock': '<path d="M16 14v2.2l1.6 1"></path> <path d="M16 2v3"></path> <path d="M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338"></path> <path d="M3 9h5.859"></path> <path d="M8 2v3"></path> <circle cx="16" cy="16" r="6"></circle>',
  'check': '<path d="M20 6 9 17l-5-5"></path>',
  'chevron-down': '<path d="m6 9 6 6 6-6"></path>',
  'chevron-left': '<path d="m15 18-6-6 6-6"></path>',
  'chevron-right': '<path d="m9 18 6-6-6-6"></path>',
  'circle-alert': '<circle cx="12" cy="12" r="10"></circle> <line x1="12" x2="12" y1="8" y2="12"></line> <line x1="12" x2="12.01" y1="16" y2="16"></line>',
  'circle-check': '<circle cx="12" cy="12" r="10"></circle> <path d="m16 9-5.5 5.5L8 12"></path>',
  'circle-user': '<circle cx="12" cy="12" r="10"></circle> <circle cx="12" cy="10" r="3"></circle> <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>',
  'clock': '<circle cx="12" cy="12" r="10"></circle> <path d="M12 6v6l4 2"></path>',
  'cloud': '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>',
  'dice-5': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect> <path d="M16 8h.01"></path> <path d="M8 8h.01"></path> <path d="M8 16h.01"></path> <path d="M16 16h.01"></path> <path d="M12 12h.01"></path>',
  'door-open': '<path d="M11 20H2"></path> <path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"></path> <path d="M11 4H8a2 2 0 0 0-2 2v14"></path> <path d="M14 12h.01"></path> <path d="M22 20h-3"></path>',
  'drama': '<path d="M10 11h.01"></path> <path d="M14 6h.01"></path> <path d="M18 6h.01"></path> <path d="M6.5 13.1h.01"></path> <path d="M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3"></path> <path d="M17.4 9.9c-.8.8-2 .8-2.8 0"></path> <path d="M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7"></path> <path d="M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4"></path>',
  'ellipsis': '<circle cx="12" cy="12" r="1"></circle> <circle cx="19" cy="12" r="1"></circle> <circle cx="5" cy="12" r="1"></circle>',
  'external-link': '<path d="M15 3h6v6"></path> <path d="M10 14 21 3"></path> <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>',
  'funnel': '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"></path>',
  'house': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
  'info': '<circle cx="12" cy="12" r="10"></circle> <path d="M12 16v-4"></path> <path d="M12 8h.01"></path>',
  'key': '<path d="m2 21 9.6-9.6"></path> <path d="m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19"></path> <circle cx="15.5" cy="7.5" r="5.5"></circle>',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
  'loader-circle': '<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path> <circle cx="12" cy="10" r="3"></circle>',
  'message-circle': '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>',
  'moon': '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path>',
  'notebook-pen': '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"></path> <path d="M2 6h4"></path> <path d="M2 10h4"></path> <path d="M2 14h4"></path> <path d="M2 18h4"></path> <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"></path>',
  'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path> <path d="m15 5 4 4"></path>',
  'plus': '<path d="M5 12h14"></path> <path d="M12 5v14"></path>',
  'search': '<path d="m21 21-4.34-4.34"></path> <circle cx="11" cy="11" r="8"></circle>',
  'settings': '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path> <circle cx="12" cy="12" r="3"></circle>',
  'sliders-horizontal': '<path d="M10 5H3"></path> <path d="M12 19H3"></path> <path d="M14 3v4"></path> <path d="M16 17v4"></path> <path d="M21 12h-9"></path> <path d="M21 19h-5"></path> <path d="M21 5h-7"></path> <path d="M8 10v4"></path> <path d="M8 12H3"></path>',
  'star': '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>',
  'sun': '<circle cx="12" cy="12" r="4"></circle> <path d="M12 2v2"></path> <path d="M12 20v2"></path> <path d="m4.93 4.93 1.41 1.41"></path> <path d="m17.66 17.66 1.41 1.41"></path> <path d="M2 12h2"></path> <path d="M20 12h2"></path> <path d="m6.34 17.66-1.41 1.41"></path> <path d="m19.07 4.93-1.41 1.41"></path>',
  'trash-2': '<path d="M10 11v6"></path> <path d="M14 11v6"></path> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path> <path d="M3 6h18"></path> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path> <path d="M12 9v4"></path> <path d="M12 17h.01"></path>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path> <circle cx="12" cy="7" r="4"></circle>',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path> <path d="M16 3.128a4 4 0 0 1 0 7.744"></path> <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path> <circle cx="9" cy="7" r="4"></circle>',
  'users-round': '<path d="M18 21a8 8 0 0 0-16 0"></path> <circle cx="10" cy="8" r="5"></circle> <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>',
  'x': '<path d="M18 6 6 18"></path> <path d="m6 6 12 12"></path>'
};
const ICON_ALIASES = {
  'add': 'plus',
  'arrow-right': 'arrow-right',
  'bell': 'bell',
  'calendar': 'calendar',
  'character': 'drama',
  'check': 'check',
  'chevron-down': 'chevron-down',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'clock': 'clock',
  'close': 'x',
  'cloud': 'cloud',
  'delete': 'trash-2',
  'dice': 'dice-5',
  'door': 'door-open',
  'edit': 'pencil',
  'error': 'circle-alert',
  'external-link': 'external-link',
  'filter': 'funnel',
  'home': 'house',
  'info': 'info',
  'key': 'key',
  'link': 'link',
  'loading': 'loader-circle',
  'members': 'users',
  'memo': 'notebook-pen',
  'message': 'message-circle',
  'moon': 'moon',
  'more': 'ellipsis',
  'place': 'map-pin',
  'scenario': 'book-open',
  'schedule': 'calendar-clock',
  'search': 'search',
  'session': 'users-round',
  'settings': 'settings',
  'star': 'star',
  'success': 'circle-check',
  'sun': 'sun',
  'tune': 'sliders-horizontal',
  'user': 'circle-user',
  'warning': 'triangle-alert'
};
const ICON_NAMES = Object.keys(ICON_ALIASES).sort();
function Icon({
  name = 'home',
  size = 20,
  strokeWidth = 1.75,
  title,
  style,
  ...rest
}) {
  const key = PATHS[name] ? name : PATHS[ICON_ALIASES[name]] ? ICON_ALIASES[name] : null;
  if (!key) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": title ? undefined : true,
    role: title ? 'img' : undefined,
    style: {
      display: 'block',
      flex: 'none',
      ...style
    }
  }, rest, {
    dangerouslySetInnerHTML: {
      __html: (title ? '<title>' + title + '</title>' : '') + PATHS[key]
    }
  }));
}
Object.assign(__ds_scope, { ICON_ALIASES, ICON_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 32,
    padding: '0 12px',
    font: 'var(--text-label)',
    gap: 6,
    icon: 16
  },
  md: {
    height: 40,
    padding: '0 16px',
    font: 'var(--text-body-sm)',
    gap: 8,
    icon: 18
  },
  lg: {
    height: 48,
    padding: '0 22px',
    font: 'var(--text-body)',
    gap: 8,
    icon: 20
  }
};
const VARIANTS = {
  primary: {
    base: {
      background: 'var(--primary)',
      color: 'var(--text-on-primary)',
      borderColor: 'transparent'
    },
    hover: {
      background: 'var(--primary-hover)'
    },
    active: {
      background: 'var(--primary-active)'
    }
  },
  secondary: {
    base: {
      background: 'var(--surface)',
      color: 'var(--primary-on-subtle)',
      borderColor: 'var(--border-strong)'
    },
    hover: {
      background: 'var(--primary-subtle)',
      borderColor: 'var(--primary)'
    },
    active: {
      background: 'var(--primary-subtle-hover)'
    }
  },
  tertiary: {
    base: {
      background: 'var(--surface-subtle)',
      color: 'var(--text-primary)',
      borderColor: 'transparent'
    },
    hover: {
      background: 'var(--primary-subtle)'
    },
    active: {
      background: 'var(--primary-subtle-hover)'
    }
  },
  accent: {
    base: {
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      borderColor: 'transparent'
    },
    hover: {
      background: 'var(--accent-hover)'
    },
    active: {
      background: 'var(--accent-active)'
    }
  },
  ghost: {
    base: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent'
    },
    hover: {
      background: 'var(--surface-subtle)',
      color: 'var(--text-primary)'
    },
    active: {
      background: 'var(--border-subtle)'
    }
  },
  danger: {
    base: {
      background: 'var(--error)',
      color: '#fff',
      borderColor: 'transparent'
    },
    hover: {
      background: 'var(--error-700)'
    },
    active: {
      background: 'var(--error-700)'
    }
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  children,
  style,
  onClick,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: off,
    "aria-busy": loading || undefined,
    onClick: off ? undefined : onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      font: s.font,
      fontWeight: variant === 'ghost' ? 'var(--weight-medium)' : 'var(--weight-semibold)',
      borderRadius: 'var(--radius-control)',
      borderWidth: 'var(--border-width)',
      borderStyle: 'solid',
      cursor: off ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
      transition: 'var(--transition-control)',
      ...v.base,
      ...(!off && hover ? v.hover : null),
      ...(!off && press ? v.active : null),
      ...(off ? {
        background: variant === 'ghost' ? 'transparent' : 'var(--surface-subtle)',
        color: 'var(--text-disabled)',
        borderColor: variant === 'ghost' ? 'transparent' : 'var(--border-subtle)'
      } : null),
      ...style
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(Spin, {
    size: s.icon
  }) : icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : null, children != null && /*#__PURE__*/React.createElement("span", null, children), iconRight && !loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }) : null);
}
function Spin({
  size = 18
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      display: 'block',
      flex: 'none',
      border: '2px solid color-mix(in oklab, currentColor 30%, transparent)',
      borderTopColor: 'currentColor',
      animation: 'tb-spin 0.7s linear infinite'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes tb-spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  icon = 'more',
  label,
  variant = 'ghost',
  size = 'md',
  style,
  ...rest
}) {
  const dim = {
    sm: 32,
    md: 40,
    lg: 48
  }[size] || 40;
  return /*#__PURE__*/React.createElement(__ds_scope.Button, _extends({
    variant: variant,
    size: size,
    icon: icon,
    "aria-label": label,
    title: label,
    style: {
      width: dim,
      padding: 0,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Initial-based avatar. No user photography in the system yet, so the fallback
   is the primary surface with the first character of the name. */
function Avatar({
  name = '',
  size = 32,
  tone = 'primary',
  ring = false,
  style,
  ...rest
}) {
  const tones = {
    primary: {
      bg: 'var(--primary-subtle)',
      fg: 'var(--primary-on-subtle)'
    },
    accent: {
      bg: 'var(--accent-subtle)',
      fg: 'var(--accent-on-subtle)'
    },
    neutral: {
      bg: 'var(--surface-subtle)',
      fg: 'var(--text-secondary)'
    }
  }[tone] || {
    bg: 'var(--primary-subtle)',
    fg: 'var(--primary-on-subtle)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    title: name,
    style: {
      width: size,
      height: size,
      flex: 'none',
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: tones.bg,
      color: tones.fg,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-medium)',
      fontSize: Math.round(size * 0.42),
      lineHeight: 1,
      userSelect: 'none',
      boxShadow: ring ? '0 0 0 2px var(--surface)' : undefined,
      ...style
    }
  }, rest), name.trim().slice(0, 1));
}
function AvatarGroup({
  names = [],
  size = 28,
  max = 4,
  style
}) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      ...style
    }
  }, shown.map((n, i) => /*#__PURE__*/React.createElement(Avatar, {
    key: n + i,
    name: n,
    size: size,
    ring: true,
    style: {
      marginLeft: i ? -size * 0.28 : 0
    }
  })), rest > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, "+", rest));
}
Object.assign(__ds_scope, { Avatar, AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    bg: 'var(--surface-subtle)',
    fg: 'var(--text-secondary)',
    bd: 'var(--border)'
  },
  primary: {
    bg: 'var(--primary-subtle)',
    fg: 'var(--primary-on-subtle)',
    bd: 'color-mix(in oklab, var(--primary) 32%, transparent)'
  },
  accent: {
    bg: 'var(--accent-subtle)',
    fg: 'var(--accent-on-subtle)',
    bd: 'color-mix(in oklab, var(--accent) 55%, transparent)'
  },
  success: {
    bg: 'var(--success-surface)',
    fg: 'var(--success-text)',
    bd: 'color-mix(in oklab, var(--success) 34%, transparent)'
  },
  info: {
    bg: 'var(--info-surface)',
    fg: 'var(--info-text)',
    bd: 'color-mix(in oklab, var(--info) 34%, transparent)'
  },
  warning: {
    bg: 'var(--warning-surface)',
    fg: 'var(--warning-text)',
    bd: 'color-mix(in oklab, var(--warning) 34%, transparent)'
  },
  error: {
    bg: 'var(--error-surface)',
    fg: 'var(--error-text)',
    bd: 'color-mix(in oklab, var(--error) 34%, transparent)'
  }
};

/* Canonical status vocabulary for たく日和. Keep these labels verbatim. */
const STATUS_TONES = {
  '募集中': 'success',
  '調整中': 'warning',
  '開催予定': 'primary',
  '完了': 'neutral',
  '中止': 'error',
  'GM': 'accent',
  'PL': 'primary',
  '回答済み': 'success',
  '未回答': 'neutral'
};
function Badge({
  children,
  status,
  tone,
  size = 'md',
  dot = false,
  style,
  ...rest
}) {
  const t = TONES[tone || STATUS_TONES[status || children] || 'neutral'];
  const label = children ?? status;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: sm ? 20 : 24,
      padding: sm ? '0 7px' : '0 9px',
      font: sm ? 'var(--text-caption)' : 'var(--text-label)',
      fontWeight: 'var(--weight-medium)',
      borderRadius: 'var(--radius-xs)',
      background: t.bg,
      color: t.fg,
      border: `var(--border-width) solid ${t.bd}`,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'currentColor'
    }
  }), label);
}
Object.assign(__ds_scope, { STATUS_TONES, Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Base surface. Hierarchy is border + surface first; shadow only on hover/raised. */
function Card({
  padding = 'var(--card-padding)',
  interactive = false,
  elevation = 1,
  onClick,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const shadow = ['none', 'var(--shadow-xs)', 'var(--shadow-sm)', 'var(--shadow-md)', 'var(--shadow-lg)'][elevation] || 'var(--shadow-xs)';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-card)',
      border: `var(--border-width) solid ${interactive && hover ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
      boxShadow: interactive && hover ? 'var(--shadow-md)' : shadow,
      padding,
      cursor: interactive ? 'pointer' : undefined,
      transition: 'box-shadow var(--duration-normal) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)',
      transform: interactive && hover ? 'translateY(-1px)' : 'none',
      ...style
    }
  }, rest), children);
}
function CardHeader({
  title,
  subtitle,
  action,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, subtitle)), action);
}
Object.assign(__ds_scope, { Card, CardHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Interactive tag: filters, selected values, removable inputs. */
function Chip({
  children,
  icon,
  selected = false,
  onClick,
  onRemove,
  disabled = false,
  size = 'md',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sm = size === 'sm';
  const interactive = !!onClick && !disabled;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: interactive ? onClick : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    role: interactive ? 'button' : undefined,
    tabIndex: interactive ? 0 : undefined,
    "aria-pressed": interactive ? selected : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: sm ? 26 : 32,
      padding: sm ? '0 10px' : '0 13px',
      font: 'var(--text-label)',
      borderRadius: 'var(--radius-full)',
      borderWidth: 'var(--border-width)',
      borderStyle: 'solid',
      borderColor: disabled ? 'var(--border-subtle)' : selected ? 'var(--primary)' : hover && interactive ? 'var(--border-strong)' : 'var(--border)',
      background: disabled ? 'var(--surface-subtle)' : selected ? 'var(--primary-subtle)' : hover && interactive ? 'var(--surface-subtle)' : 'var(--surface)',
      color: disabled ? 'var(--text-disabled)' : selected ? 'var(--primary-on-subtle)' : 'var(--text-secondary)',
      cursor: disabled ? 'not-allowed' : interactive ? 'pointer' : 'default',
      transition: 'var(--transition-control)',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), children, onRemove && /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      display: 'grid',
      placeItems: 'center',
      marginRight: -3,
      opacity: 0.6,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 13
  })));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Chip.jsx", error: String((e && e.message) || e) }); }

// components/display/MemberCard.jsx
try { (() => {
function MemberCard({
  name,
  handle,
  role,
  sessions,
  lastActive,
  answered,
  onMore,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    size: 44
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body)',
      fontWeight: 'var(--weight-medium)'
    }
  }, name), role && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    status: role,
    size: "sm"
  }), answered && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    status: answered,
    size: "sm"
  })), handle && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, "@", handle), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, sessions != null && `参加 ${sessions} 卓`, sessions != null && lastActive && ' · ', lastActive)), onMore && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "more",
    label: "\u30E1\u30F3\u30D0\u30FC\u64CD\u4F5C",
    size: "sm",
    onClick: onMore
  }));
}
Object.assign(__ds_scope, { MemberCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/MemberCard.jsx", error: String((e && e.message) || e) }); }

// components/display/ScenarioCard.jsx
try { (() => {
/* A scenario in the library: title, author, player count, playtime, tags. */
function ScenarioCard({
  title,
  author,
  playerCount,
  duration,
  tags = [],
  note,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    interactive: !!onClick,
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      flex: 'none',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--sky-scene)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--sky-800)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "scenario",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, title), author && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, author), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      marginTop: 2
    }
  }, playerCount && /*#__PURE__*/React.createElement(Stat, {
    icon: "members",
    label: playerCount
  }), duration && /*#__PURE__*/React.createElement(Stat, {
    icon: "clock",
    label: duration
  })))), note && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, note), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-2)'
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    key: t,
    size: "sm"
  }, t))));
}
function Stat({
  icon,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), label);
}
Object.assign(__ds_scope, { ScenarioCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ScenarioCard.jsx", error: String((e && e.message) || e) }); }

// components/display/ScheduleCard.jsx
try { (() => {
/* 日程調整 row: one candidate date with a per-member availability summary. */
function ScheduleCard({
  date,
  weekday,
  time,
  responses = [],
  answered,
  total,
  status = '調整中',
  onRespond,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 62,
      flex: 'none',
      textAlign: 'center',
      padding: '8px 0',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--primary-subtle)',
      color: 'var(--primary-on-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-caption)',
      letterSpacing: 'var(--tracking-wide)'
    }
  }, weekday), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      fontWeight: 'var(--weight-bold)',
      lineHeight: 1.2
    }
  }, date)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body)',
      fontWeight: 'var(--weight-medium)'
    }
  }, time), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    status: status,
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, responses.map((r, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    title: r.name,
    style: {
      width: 20,
      height: 20,
      borderRadius: 'var(--radius-xs)',
      display: 'grid',
      placeItems: 'center',
      font: 'var(--text-caption)',
      fontWeight: 'var(--weight-medium)',
      background: r.value === 'ok' ? 'var(--success-surface)' : r.value === 'maybe' ? 'var(--warning-surface)' : r.value === 'no' ? 'var(--error-surface)' : 'var(--surface-subtle)',
      color: r.value === 'ok' ? 'var(--success-text)' : r.value === 'maybe' ? 'var(--warning-text)' : r.value === 'no' ? 'var(--error-text)' : 'var(--text-tertiary)'
    }
  }, r.value === 'ok' ? '○' : r.value === 'maybe' ? '△' : r.value === 'no' ? '×' : '−'))), total != null && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, "\u56DE\u7B54 ", answered, " / ", total))), onRespond && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "tertiary",
    onClick: onRespond
  }, "\u56DE\u7B54\u3059\u308B"));
}
Object.assign(__ds_scope, { ScheduleCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ScheduleCard.jsx", error: String((e && e.message) || e) }); }

// components/display/SessionCard.jsx
try { (() => {
/* The primary object in たく日和: one session (卓) of a scenario. */
function SessionCard({
  title,
  scenario,
  status = '募集中',
  datetime,
  place,
  players = [],
  capacity,
  role,
  actionLabel = '詳細を見る',
  onAction,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    interactive: !!onClick,
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    status: status,
    dot: true
  }), role && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    status: role,
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, title), scenario && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "scenario",
    size: 15
  }), scenario))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)'
    }
  }, datetime && /*#__PURE__*/React.createElement(Meta, {
    icon: "schedule",
    label: datetime
  }), place && /*#__PURE__*/React.createElement(Meta, {
    icon: "place",
    label: place
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      paddingTop: 'var(--space-3)',
      borderTop: 'var(--border-width) solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.AvatarGroup, {
    names: players
  }), capacity && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, players.length, " / ", capacity, " \u4EBA")), onAction && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "secondary",
    onClick: onAction
  }, actionLabel)));
}
function Meta({
  icon,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      font: 'var(--text-body-sm)',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    style: {
      color: 'var(--text-tertiary)'
    }
  }), label);
}
Object.assign(__ds_scope, { SessionCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/SessionCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: {
    icon: 'info',
    bg: 'var(--info-surface)',
    bd: 'var(--info)',
    fg: 'var(--info-text)'
  },
  success: {
    icon: 'success',
    bg: 'var(--success-surface)',
    bd: 'var(--success)',
    fg: 'var(--success-text)'
  },
  warning: {
    icon: 'warning',
    bg: 'var(--warning-surface)',
    bd: 'var(--warning)',
    fg: 'var(--warning-text)'
  },
  error: {
    icon: 'error',
    bg: 'var(--error-surface)',
    bd: 'var(--error)',
    fg: 'var(--error-text)'
  }
};
function Alert({
  tone = 'info',
  title,
  children,
  action,
  onClose,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: tone === 'error' ? 'alert' : 'status',
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      background: t.bg,
      borderRadius: 'var(--radius-sm)',
      border: `var(--border-width) solid color-mix(in oklab, ${t.bd} 34%, transparent)`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 19,
    style: {
      color: t.bd,
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: t.fg
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-primary)'
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-2)'
    }
  }, action)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "close",
    label: "\u9589\u3058\u308B",
    size: "sm",
    onClick: onClose,
    style: {
      margin: -4
    }
  }));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Short confirmation. One question, two answers. */
function Dialog({
  open = true,
  tone = 'default',
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
  style,
  ...rest
}) {
  if (!open) return null;
  const destructive = tone === 'danger';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 55,
      background: 'var(--overlay)',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--space-6)'
    },
    onClick: onCancel
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "alertdialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: 400,
      padding: 'var(--space-5)',
      textAlign: 'center',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-sheet)',
      border: 'var(--border-width) solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-3)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: destructive ? 'var(--error-surface)' : 'var(--primary-subtle)',
      color: destructive ? 'var(--error)' : 'var(--primary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: destructive ? 'warning' : 'info',
    size: 20
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)'
    }
  }, title), message && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, message), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      width: '100%',
      marginTop: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "tertiary",
    fullWidth: true,
    onClick: onCancel
  }, cancelLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: destructive ? 'danger' : 'primary',
    fullWidth: true,
    onClick: onConfirm
  }, confirmLabel))));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Calm empty state: a small sky vignette, one line of explanation, one action. */
function EmptyState({
  icon = 'cloud',
  title,
  description,
  action,
  compact = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-3)',
      padding: compact ? 'var(--space-8) var(--space-5)' : 'var(--space-12) var(--space-6)',
      background: 'var(--surface)',
      border: 'var(--border-width) dashed var(--border)',
      borderRadius: 'var(--radius-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 'var(--radius-full)',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--sky-scene)',
      color: 'var(--sky-800)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)',
      maxWidth: 380
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-2)'
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Sheet-style overlay for larger flows (卓をつくる, シナリオを登録). */
function Modal({
  open = true,
  title,
  subtitle,
  width = 520,
  onClose,
  footer,
  children,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      background: 'var(--overlay)',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--space-6)',
      animation: 'tb-fade var(--duration-normal) var(--ease-standard)'
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes tb-fade{from{opacity:0}to{opacity:1}}@keyframes tb-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'), /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      maxHeight: '100%',
      overflow: 'auto',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-sheet)',
      border: 'var(--border-width) solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      animation: 'tb-rise var(--duration-normal) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      padding: 'var(--space-5) var(--space-5) var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, subtitle)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "close",
    label: "\u9589\u3058\u308B",
    size: "sm",
    onClick: onClose,
    style: {
      margin: -6
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--space-5) var(--space-5)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-2)',
      padding: 'var(--space-4) var(--space-5)',
      borderTop: 'var(--border-width) solid var(--border-subtle)',
      background: 'var(--surface-subtle)',
      borderRadius: '0 0 var(--radius-sheet) var(--radius-sheet)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Loading placeholder. Slow, low-contrast shimmer — never a flashing pulse. */
function Skeleton({
  width = '100%',
  height = 12,
  radius = 'var(--radius-xs)',
  circle = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    style: {
      display: 'block',
      width: circle ? height : width,
      height,
      borderRadius: circle ? '50%' : radius,
      background: 'linear-gradient(90deg, var(--surface-subtle) 0%, color-mix(in oklab, var(--surface-subtle) 60%, var(--border-subtle)) 50%, var(--surface-subtle) 100%)',
      backgroundSize: '200% 100%',
      animation: 'tb-shimmer 1.6s var(--ease-standard) infinite',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, '@keyframes tb-shimmer{from{background-position:120% 0}to{background-position:-20% 0}}'));
}
function SkeletonCard({
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      padding: 'var(--card-padding)',
      background: 'var(--surface)',
      border: 'var(--border-width) solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    width: 72,
    height: 20,
    radius: "var(--radius-xs)"
  }), /*#__PURE__*/React.createElement(Skeleton, {
    width: "70%",
    height: 18
  }), /*#__PURE__*/React.createElement(Skeleton, {
    width: "45%",
    height: 13
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    height: 26,
    circle: true
  }), /*#__PURE__*/React.createElement(Skeleton, {
    height: 26,
    circle: true
  }), /*#__PURE__*/React.createElement(Skeleton, {
    height: 26,
    circle: true
  })));
}
Object.assign(__ds_scope, { Skeleton, SkeletonCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Spinner({
  size = 20,
  label,
  tone = 'primary',
  style,
  ...rest
}) {
  const color = tone === 'primary' ? 'var(--primary)' : tone === 'inverse' ? 'var(--text-inverse)' : 'var(--text-tertiary)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      ...style
    },
    role: "status"
  }, rest), /*#__PURE__*/React.createElement("style", null, '@keyframes tb-spinner{to{transform:rotate(360deg)}}'), /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      flex: 'none',
      borderRadius: '50%',
      border: `${Math.max(2, Math.round(size / 10))}px solid color-mix(in oklab, ${color} 24%, transparent)`,
      borderTopColor: color,
      animation: 'tb-spinner 0.7s linear infinite'
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ICONS = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error'
};
const COLORS = {
  info: 'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)'
};

/* Transient confirmation. Slides up from the bottom-right, no bounce. */
function Toast({
  tone = 'success',
  title,
  description,
  onClose,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      minWidth: 280,
      maxWidth: 400,
      padding: 'var(--space-4)',
      background: 'var(--surface-raised)',
      color: 'var(--text-primary)',
      border: 'var(--border-width) solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      animation: 'tb-toast-in var(--duration-normal) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, '@keyframes tb-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICONS[tone] || 'info',
    size: 19,
    style: {
      color: COLORS[tone],
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      fontWeight: 'var(--weight-semibold)'
    }
  }, title), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, description)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "close",
    label: "\u9589\u3058\u308B",
    size: "sm",
    onClick: onClose,
    style: {
      margin: -4
    }
  }));
}
function ToastStack({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: 'var(--space-6)',
      bottom: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      zIndex: 60,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Toast, ToastStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  label,
  placement = 'top',
  children,
  style
}) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translate(-50%, -8px)'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translate(-50%, 8px)'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translate(-8px, -50%)'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translate(8px, -50%)'
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    }
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos,
      zIndex: 70,
      pointerEvents: 'none',
      padding: '5px 9px',
      borderRadius: 'var(--radius-xs)',
      whiteSpace: 'nowrap',
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      font: 'var(--text-caption)',
      boxShadow: 'var(--shadow-md)',
      opacity: open ? 1 : 0,
      transition: 'opacity var(--duration-fast) var(--ease-standard)'
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  label,
  description,
  disabled = false,
  error = false,
  id,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const on = checked || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    id: id,
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      flex: 'none',
      marginTop: description ? 3 : 0,
      borderRadius: 'var(--radius-xs)',
      borderWidth: 'var(--border-width-strong)',
      borderStyle: 'solid',
      borderColor: disabled ? 'var(--border-subtle)' : on ? 'var(--primary)' : error ? 'var(--error)' : hover ? 'var(--border-strong)' : 'var(--border-strong)',
      background: disabled ? 'var(--surface-subtle)' : on ? 'var(--primary)' : hover ? 'var(--primary-subtle)' : 'var(--surface)',
      color: 'var(--text-on-primary)',
      display: 'grid',
      placeItems: 'center',
      transition: 'var(--transition-control)'
    }
  }, indeterminate ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 2,
      borderRadius: 1,
      background: 'currentColor'
    }
  }) : checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 2.5
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/FormField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Label + helper/error/success message wrapper shared by every form control. */
function FormField({
  label,
  htmlFor,
  required = false,
  optional = false,
  helper,
  error,
  success,
  children,
  style,
  ...rest
}) {
  const msg = error || success || helper;
  const tone = error ? 'var(--error-text)' : success ? 'var(--success-text)' : 'var(--text-secondary)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      font: 'var(--text-label)',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--error)'
    },
    "aria-hidden": "true"
  }, "*"), optional && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, "\u4EFB\u610F")), children, msg && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: tone
    }
  }, msg));
}
Object.assign(__ds_scope, { FormField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FormField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  checked = false,
  onChange,
  label,
  description,
  name,
  value,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    id: id,
    name: name,
    value: value,
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      flex: 'none',
      marginTop: description ? 3 : 0,
      borderRadius: '50%',
      borderWidth: 'var(--border-width-strong)',
      borderStyle: 'solid',
      borderColor: disabled ? 'var(--border-subtle)' : checked ? 'var(--primary)' : 'var(--border-strong)',
      background: disabled ? 'var(--surface-subtle)' : hover && !checked ? 'var(--primary-subtle)' : 'var(--surface)',
      display: 'grid',
      placeItems: 'center',
      transition: 'var(--transition-control)'
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: disabled ? 'var(--text-disabled)' : 'var(--primary)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    id: id,
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 22,
      flex: 'none',
      marginTop: description ? 2 : 0,
      borderRadius: 'var(--radius-full)',
      background: disabled ? 'var(--border-subtle)' : checked ? 'var(--primary)' : 'var(--border-strong)',
      position: 'relative',
      transition: 'background-color var(--duration-normal) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 21 : 3,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--ink-0)',
      boxShadow: 'var(--shadow-xs)',
      transition: 'left var(--duration-normal) var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-secondary)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function fieldChrome({
  hover,
  focus,
  error,
  success,
  disabled
}) {
  return {
    width: '100%',
    font: 'var(--text-body-sm)',
    color: 'var(--text-primary)',
    background: disabled ? 'var(--surface-subtle)' : 'var(--surface)',
    borderWidth: 'var(--border-width)',
    borderStyle: 'solid',
    borderColor: disabled ? 'var(--border-subtle)' : error ? 'var(--error)' : success ? 'var(--success)' : focus ? 'var(--border-focus)' : hover ? 'var(--border-strong)' : 'var(--border)',
    borderRadius: 'var(--radius-control)',
    boxShadow: focus && !disabled ? 'var(--focus-ring)' : 'none',
    outline: 'none',
    transition: 'var(--transition-control)',
    ...(disabled ? {
      color: 'var(--text-disabled)',
      cursor: 'not-allowed'
    } : null)
  };
}
function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  suffix,
  error = false,
  success = false,
  disabled = false,
  size = 'md',
  id,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const height = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height,
      padding: '0 12px',
      ...fieldChrome({
        hover,
        focus,
        error,
        success,
        disabled
      }),
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    style: {
      color: 'var(--text-tertiary)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    "aria-invalid": error || undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'inherit',
      color: 'inherit',
      height: '100%'
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap'
    }
  }, suffix));
}
Object.assign(__ds_scope, { fieldChrome, TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/DateInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Date / datetime field. Uses the native picker — 日程調整 screens live on this. */
function DateInput({
  value,
  onChange,
  withTime = false,
  error = false,
  success = false,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 40,
      padding: '0 12px',
      ...__ds_scope.fieldChrome({
        hover,
        focus,
        error,
        success,
        disabled
      }),
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: withTime ? 'schedule' : 'calendar',
    size: 16,
    style: {
      color: 'var(--text-tertiary)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: withTime ? 'datetime-local' : 'date',
    value: value,
    onChange: onChange,
    disabled: disabled,
    "aria-invalid": error || undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'inherit',
      color: 'inherit'
    }
  }, rest)));
}
Object.assign(__ds_scope, { DateInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/DateInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  value,
  onChange,
  options = [],
  placeholder = '選択してください',
  error = false,
  success = false,
  disabled = false,
  size = 'md',
  id,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const height = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height,
      ...__ds_scope.fieldChrome({
        hover,
        focus,
        error,
        success,
        disabled
      }),
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: id,
    value: value,
    onChange: onChange,
    disabled: disabled,
    "aria-invalid": error || undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      flex: 1,
      height: '100%',
      padding: '0 34px 0 12px',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'inherit',
      color: value ? 'inherit' : 'var(--text-tertiary)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, rest), /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value,
      disabled: opt.disabled
    }, opt.label);
  })), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      position: 'absolute',
      right: 11,
      color: 'var(--text-tertiary)',
      pointerEvents: 'none'
    }
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  error = false,
  success = false,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("textarea", _extends({
    id: id,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    rows: rows,
    maxLength: maxLength,
    disabled: disabled,
    "aria-invalid": error || undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      display: 'block',
      padding: '10px 12px',
      resize: 'vertical',
      lineHeight: 1.8,
      ...__ds_scope.fieldChrome({
        hover,
        focus,
        error,
        success,
        disabled
      }),
      ...style
    }
  }, rest)), maxLength && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 10,
      bottom: 8,
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, (value || '').length, " / ", maxLength));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function Breadcrumb({
  items = [],
  onNavigate,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "\u73FE\u5728\u306E\u4F4D\u7F6E",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      flexWrap: 'wrap',
      ...style
    }
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: it.label + i
    }, last ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-caption)',
        color: 'var(--text-primary)'
      },
      "aria-current": "page"
    }, it.label) : /*#__PURE__*/React.createElement("a", {
      href: it.href || '#',
      onClick: e => {
        if (onNavigate) {
          e.preventDefault();
          onNavigate(it);
        }
      },
      style: {
        font: 'var(--text-caption)',
        color: 'var(--text-secondary)',
        textDecoration: 'none'
      }
    }, it.label), !last && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 13,
      style: {
        color: 'var(--text-tertiary)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/GlobalNav.jsx
try { (() => {
const DEFAULT_ITEMS = [{
  id: 'home',
  label: 'ホーム',
  icon: 'home'
}, {
  id: 'session',
  label: '卓',
  icon: 'session'
}, {
  id: 'scenario',
  label: 'シナリオ',
  icon: 'scenario'
}, {
  id: 'schedule',
  label: '日程調整',
  icon: 'schedule'
}, {
  id: 'members',
  label: 'メンバー',
  icon: 'members'
}];
function GlobalNav({
  items = DEFAULT_ITEMS,
  active = 'home',
  onNavigate,
  user,
  theme = 'light',
  onToggleTheme,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 'var(--nav-height)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)',
      padding: '0 var(--space-6)',
      background: 'var(--surface)',
      borderBottom: 'var(--border-width) solid var(--border-subtle)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    size: 18
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      flex: 1
    }
  }, items.map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.id,
    item: it,
    active: active === it.id,
    onClick: () => onNavigate && onNavigate(it.id)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "search",
    label: "\u691C\u7D22",
    size: "sm"
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "bell",
    label: "\u304A\u77E5\u3089\u305B",
    size: "sm"
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: theme === 'dark' ? 'sun' : 'moon',
    label: "\u8868\u793A\u30C6\u30FC\u30DE\u3092\u5207\u308A\u66FF\u3048",
    size: "sm",
    onClick: onToggleTheme
  }), user && /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: user,
    size: 30
  })));
}
function NavItem({
  item,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    "aria-current": active ? 'page' : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      height: 36,
      padding: '0 12px',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      font: 'var(--text-body-sm)',
      fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-regular)',
      background: active ? 'var(--primary-subtle)' : hover ? 'var(--surface-subtle)' : 'transparent',
      color: active ? 'var(--primary-on-subtle)' : 'var(--text-secondary)',
      transition: 'var(--transition-control)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: item.icon,
    size: 17
  }), item.label);
}
Object.assign(__ds_scope, { GlobalNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/GlobalNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
function Pagination({
  page = 1,
  totalPages = 1,
  onChange,
  style
}) {
  const go = p => onChange && p >= 1 && p <= totalPages && p !== page && onChange(p);
  const pages = React.useMemo(() => {
    const out = [];
    const push = p => out.push(p);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return out;
    }
    push(1);
    if (page > 3) push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
    if (page < totalPages - 2) push('…');
    push(totalPages);
    return out;
  }, [page, totalPages]);
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "\u30DA\u30FC\u30B8\u9001\u308A",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(Arrow, {
    icon: "chevron-left",
    label: "\u524D\u306E\u30DA\u30FC\u30B8",
    disabled: page <= 1,
    onClick: () => go(page - 1)
  }), pages.map((p, i) => p === '…' ? /*#__PURE__*/React.createElement("span", {
    key: 'e' + i,
    style: {
      width: 32,
      textAlign: 'center',
      font: 'var(--text-body-sm)',
      color: 'var(--text-tertiary)'
    }
  }, "\u2026") : /*#__PURE__*/React.createElement(PageBtn, {
    key: p,
    p: p,
    active: p === page,
    onClick: () => go(p)
  })), /*#__PURE__*/React.createElement(Arrow, {
    icon: "chevron-right",
    label: "\u6B21\u306E\u30DA\u30FC\u30B8",
    disabled: page >= totalPages,
    onClick: () => go(page + 1)
  }));
}
function PageBtn({
  p,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-current": active ? 'page' : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      borderWidth: 'var(--border-width)',
      borderStyle: 'solid',
      borderColor: active ? 'var(--primary)' : 'transparent',
      background: active ? 'var(--primary-subtle)' : hover ? 'var(--surface-subtle)' : 'transparent',
      color: active ? 'var(--primary-on-subtle)' : 'var(--text-secondary)',
      font: 'var(--text-body-sm)',
      fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-regular)',
      transition: 'var(--transition-control)'
    }
  }, p);
}
function Arrow({
  icon,
  label,
  disabled,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    "aria-label": label,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: 32,
      height: 32,
      display: 'grid',
      placeItems: 'center',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: !disabled && hover ? 'var(--surface-subtle)' : 'transparent',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
      transition: 'var(--transition-control)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/* Underline tabs. The active indicator is the sun colour — the one place
   accent appears in navigation. */
function Tabs({
  tabs = [],
  active,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-5)',
      borderBottom: 'var(--border-width) solid var(--border-subtle)',
      ...style
    }
  }, tabs.map(t => {
    const tab = typeof t === 'string' ? {
      id: t,
      label: t
    } : t;
    const on = tab.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.id,
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(tab.id),
      style: {
        position: 'relative',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '0 2px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        font: 'var(--text-body-sm)',
        fontWeight: on ? 'var(--weight-semibold)' : 'var(--weight-regular)',
        color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'color var(--duration-fast) var(--ease-standard)'
      }
    }, tab.label, tab.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-caption)',
        padding: '1px 6px',
        borderRadius: 'var(--radius-full)',
        background: on ? 'var(--primary-subtle)' : 'var(--surface-subtle)',
        color: on ? 'var(--primary-on-subtle)' : 'var(--text-tertiary)'
      }
    }, tab.count), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        borderRadius: 2,
        background: on ? 'var(--accent-line)' : 'transparent'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/taku-biyori-app/App.jsx
try { (() => {
const {
  GlobalNav,
  Modal,
  Button,
  Toast,
  ToastStack,
  FormField,
  TextInput,
  Textarea,
  Select,
  DateInput,
  Checkbox,
  Radio
} = window.DesignSystem_9512d8;
function App() {
  const [view, setView] = React.useState('home');
  const [theme, setTheme] = React.useState('light');
  const [create, setCreate] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toast = (title, description) => {
    const id = Date.now();
    setToasts(t => [...t, {
      id,
      title,
      description
    }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };
  const nav = v => {
    setView(v);
    window.scrollTo(0, 0);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(GlobalNav, {
    active: view === 'detail' ? 'session' : view,
    onNavigate: nav,
    user: "\u3055\u304F\u3089",
    theme: theme,
    onToggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light')
  }), view === 'home' && /*#__PURE__*/React.createElement(HomeScreen, {
    onNavigate: nav,
    onCreate: () => setCreate(true)
  }), view === 'session' && /*#__PURE__*/React.createElement(SessionListScreen, {
    onNavigate: nav,
    onCreate: () => setCreate(true)
  }), view === 'detail' && /*#__PURE__*/React.createElement(SessionDetailScreen, {
    onNavigate: nav,
    onToast: toast
  }), view === 'scenario' && /*#__PURE__*/React.createElement(ScenarioScreen, {
    onCreate: () => setCreate(true)
  }), view === 'schedule' && /*#__PURE__*/React.createElement(ScheduleScreen, {
    onToast: toast
  }), view === 'members' && /*#__PURE__*/React.createElement(MembersScreen, null), /*#__PURE__*/React.createElement(CreateSessionModal, {
    open: create,
    onClose: () => setCreate(false),
    onCreate: () => {
      setCreate(false);
      toast('卓を作成しました', 'メンバーに招待リンクを送れます');
      nav('session');
    }
  }), /*#__PURE__*/React.createElement(ToastStack, null, toasts.map(t => /*#__PURE__*/React.createElement(Toast, {
    key: t.id,
    tone: "success",
    title: t.title,
    description: t.description,
    onClose: () => setToasts(x => x.filter(y => y.id !== t.id))
  }))));
}
function CreateSessionModal({
  open,
  onClose,
  onCreate
}) {
  const [name, setName] = React.useState('');
  const [mode, setMode] = React.useState('online');
  const [beginner, setBeginner] = React.useState(true);
  const [touched, setTouched] = React.useState(false);
  const invalid = touched && name.trim() === '';
  const submit = () => {
    setTouched(true);
    if (name.trim() !== '') onCreate();
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement(Modal, {
    open: true,
    title: "\u5353\u3092\u3064\u304F\u308B",
    subtitle: "\u3042\u3068\u304B\u3089\u5909\u66F4\u3067\u304D\u307E\u3059",
    width: 560,
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "tertiary",
      onClick: onClose
    }, "\u30AD\u30E3\u30F3\u30BB\u30EB"), /*#__PURE__*/React.createElement(Button, {
      onClick: submit
    }, "\u4F5C\u6210\u3059\u308B"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(FormField, {
    label: "\u5353\u306E\u540D\u524D",
    required: true,
    error: invalid ? '卓の名前を入力してください' : undefined,
    helper: "\u4F8B\uFF1A\u91D1\u66DC\u591C\u306E\u5353"
  }, /*#__PURE__*/React.createElement(TextInput, {
    value: name,
    error: invalid,
    onChange: e => setName(e.target.value),
    placeholder: "\u91D1\u66DC\u591C\u306E\u5353"
  })), /*#__PURE__*/React.createElement(FormField, {
    label: "\u30B7\u30CA\u30EA\u30AA"
  }, /*#__PURE__*/React.createElement(Select, {
    value: "",
    options: SCENARIOS.map(s => ({
      value: s.title,
      label: s.title
    })),
    placeholder: "\u30B7\u30CA\u30EA\u30AA\u3092\u9078\u3076"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(FormField, {
    label: "\u958B\u50AC\u65E5\u6642",
    helper: "\u672A\u5B9A\u306E\u307E\u307E\u3067\u3082\u4F5C\u6210\u3067\u304D\u307E\u3059"
  }, /*#__PURE__*/React.createElement(DateInput, {
    withTime: true
  })), /*#__PURE__*/React.createElement(FormField, {
    label: "\u5B9A\u54E1"
  }, /*#__PURE__*/React.createElement(TextInput, {
    type: "number",
    defaultValue: "5",
    suffix: "\u4EBA"
  }))), /*#__PURE__*/React.createElement(FormField, {
    label: "\u958B\u50AC\u65B9\u6CD5"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "mode",
    label: "\u30AA\u30F3\u30E9\u30A4\u30F3",
    checked: mode === 'online',
    onChange: () => setMode('online')
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "mode",
    label: "\u5BFE\u9762",
    checked: mode === 'offline',
    onChange: () => setMode('offline')
  }))), /*#__PURE__*/React.createElement(FormField, {
    label: "\u3072\u3068\u3053\u3068",
    optional: true
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 3,
    maxLength: 200,
    placeholder: "\u5F53\u65E5\u306E\u6D41\u308C\u3084\u6CE8\u610F\u70B9\u3092\u66F8\u3044\u3066\u304A\u3051\u307E\u3059"
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "\u521D\u5FC3\u8005\u6B53\u8FCE\u3068\u3057\u3066\u52DF\u96C6\u3059\u308B",
    description: "\u30EB\u30FC\u30EB\u8AAC\u660E\u306E\u6642\u9593\u3092\u78BA\u4FDD\u3057\u307E\u3059",
    checked: beginner,
    onChange: e => setBeginner(e.target.checked)
  }))));
}
Object.assign(window, {
  App,
  CreateSessionModal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/taku-biyori-app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/taku-biyori-app/HomeScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SkyScene,
  Button,
  IconButton,
  Icon,
  Card,
  SessionCard,
  ScheduleCard,
  Badge,
  Chip,
  Alert,
  EmptyState,
  AvatarGroup,
  Tooltip
} = window.DesignSystem_9512d8;
function HomeScreen({
  onNavigate,
  onCreate
}) {
  const next = SESSIONS[1];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SkyScene, {
    height: 228,
    radius: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-lg)',
      margin: '0 auto',
      height: '100%',
      padding: '0 var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      paddingBottom: 'var(--space-8)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-overline",
    style: {
      color: 'var(--sky-800)'
    }
  }, "3\u670818\u65E5 \u706B\u66DC\u65E5"), /*#__PURE__*/React.createElement("h1", {
    className: "ds-display",
    style: {
      color: 'var(--sky-950)'
    }
  }, "\u3053\u3093\u306B\u3061\u306F\u3001\u3055\u304F\u3089\u3055\u3093"), /*#__PURE__*/React.createElement("p", {
    className: "ds-body",
    style: {
      color: 'var(--sky-900)',
      marginTop: 4
    }
  }, "\u4ECA\u9031\u306F2\u3064\u306E\u5353\u304C\u5F85\u3063\u3066\u3044\u307E\u3059\u3002"))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-lg)',
      margin: '0 auto',
      padding: 'var(--space-8) var(--space-6) var(--space-16)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-10)'
    }
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "warning",
    title: "\u300C\u6C34\u66DC\u306E\u306A\u3089\u3057\u5353\u300D\u306E\u65E5\u7A0B\u304C\u672A\u78BA\u5B9A\u3067\u3059",
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => onNavigate('schedule')
    }, "\u65E5\u7A0B\u3092\u78BA\u8A8D\u3059\u308B")
  }, "\u3042\u30682\u4EBA\u306E\u56DE\u7B54\u3092\u5F85\u3063\u3066\u3044\u307E\u3059\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 'var(--space-6)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    label: "Next",
    title: "\u6B21\u306E\u5353",
    more: () => onNavigate('session')
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    },
    elevation: 2
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: next.status,
    dot: true
  }), /*#__PURE__*/React.createElement(Badge, {
    status: next.role,
    size: "sm"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Tooltip, {
    label: "\u62DB\u5F85\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "link",
    label: "\u62DB\u5F85\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC",
    size: "sm"
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: "more",
    label: "\u64CD\u4F5C",
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("h3", {
    className: "ds-h2"
  }, next.title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "scenario",
    size: 15
  }), next.scenario)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Row, {
    icon: "schedule",
    label: next.datetime
  }), /*#__PURE__*/React.createElement(Row, {
    icon: "place",
    label: next.place
  }), /*#__PURE__*/React.createElement(Row, {
    icon: "members",
    label: `${next.players.length} / ${next.capacity} 人 · 全員が参加を回答済み`
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      paddingTop: 'var(--space-3)',
      borderTop: 'var(--border-width) solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(AvatarGroup, {
    names: next.players,
    size: 30
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary",
    size: "sm",
    icon: "memo"
  }, "\u5F53\u65E5\u30E1\u30E2"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => onNavigate('detail')
  }, "\u5353\u3092\u958B\u304F")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    label: "Schedule",
    title: "\u56DE\u7B54\u5F85\u3061\u306E\u65E5\u7A0B",
    more: () => onNavigate('schedule')
  }), CANDIDATES.slice(1).map(c => /*#__PURE__*/React.createElement(ScheduleCard, _extends({
    key: c.date
  }, c, {
    total: 5,
    onRespond: () => onNavigate('schedule')
  }))), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "\u4ECA\u6708\u306E\u3075\u308A\u304B\u3048\u308A"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    value: "3",
    label: "\u53C2\u52A0\u3057\u305F\u5353"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "2",
    label: "GM \u3092\u3057\u305F\u5353"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "4",
    label: "\u8AAD\u3093\u3060\u30B7\u30CA\u30EA\u30AA"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    label: "Open",
    title: "\u52DF\u96C6\u4E2D\u306E\u5353",
    more: () => onNavigate('session')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-4)'
    }
  }, SESSIONS.filter(s => s.status === '募集中' || s.status === '調整中').map(s => /*#__PURE__*/React.createElement(SessionCard, _extends({
    key: s.id
  }, s, {
    onClick: () => onNavigate('detail'),
    onAction: () => onNavigate('detail')
  }))))), /*#__PURE__*/React.createElement(EmptyState, {
    icon: "memo",
    title: "\u4E0B\u66F8\u304D\u306E\u5353\u306F\u3042\u308A\u307E\u305B\u3093",
    description: "\u601D\u3044\u3064\u3044\u305F\u5353\u306F\u4E0B\u66F8\u304D\u3068\u3057\u3066\u4FDD\u5B58\u3057\u3066\u304A\u3051\u307E\u3059\u3002\u65E5\u7A0B\u304C\u6C7A\u307E\u3063\u3066\u304B\u3089\u516C\u958B\u3067\u304D\u307E\u3059\u3002",
    action: /*#__PURE__*/React.createElement(Button, {
      icon: "add",
      variant: "secondary",
      onClick: onCreate
    }, "\u5353\u3092\u3064\u304F\u308B")
  })));
}
function Row({
  icon,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      font: 'var(--text-body-sm)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16,
    style: {
      color: 'var(--text-tertiary)'
    }
  }), label);
}
function Stat({
  value,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 'var(--weight-bold)',
      lineHeight: 1.2
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    className: "ds-caption"
  }, label));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/taku-biyori-app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/taku-biyori-app/ScenarioScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  TextInput,
  Select,
  Chip,
  ScenarioCard,
  Pagination,
  EmptyState,
  Tabs,
  MemberCard,
  Card
} = window.DesignSystem_9512d8;
const TAGS = ['マーダーミステリー', 'TRPG', '初心者歓迎', '経験者向け', 'オンライン可', '再演不可'];
function ScenarioScreen({
  onCreate
}) {
  const [selected, setSelected] = React.useState(['マーダーミステリー']);
  const [page, setPage] = React.useState(1);
  const toggle = t => setSelected(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);
  const shown = SCENARIOS.filter(s => selected.length === 0 || selected.some(t => s.tags.includes(t)));
  return /*#__PURE__*/React.createElement(Page, {
    title: "\u30B7\u30CA\u30EA\u30AA",
    breadcrumb: [{
      label: 'ホーム'
    }, {
      label: 'シナリオ'
    }],
    action: /*#__PURE__*/React.createElement(Button, {
      icon: "add",
      variant: "secondary",
      onClick: onCreate
    }, "\u30B7\u30CA\u30EA\u30AA\u3092\u767B\u9332")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    icon: "search",
    placeholder: "\u30BF\u30A4\u30C8\u30EB\u30FB\u4F5C\u8005\u3067\u691C\u7D22",
    style: {
      maxWidth: 320
    }
  }), /*#__PURE__*/React.createElement(Select, {
    value: "new",
    options: [{
      value: 'new',
      label: '新しい順'
    }, {
      value: 'players',
      label: '人数が少ない順'
    }, {
      value: 'time',
      label: '短い順'
    }],
    style: {
      maxWidth: 180
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ds-caption",
    style: {
      alignSelf: 'center'
    }
  }, shown.length, " \u4EF6")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-2)'
    }
  }, TAGS.map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    selected: selected.includes(t),
    onClick: () => toggle(t)
  }, t)))), shown.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "scenario",
    title: "\u6761\u4EF6\u306B\u5408\u3046\u30B7\u30CA\u30EA\u30AA\u304C\u3042\u308A\u307E\u305B\u3093",
    description: "\u30BF\u30B0\u3092\u5916\u3059\u304B\u3001\u30AD\u30FC\u30EF\u30FC\u30C9\u3092\u5909\u3048\u3066\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setSelected([])
    }, "\u30BF\u30B0\u3092\u89E3\u9664")
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-4)'
    }
  }, shown.map(s => /*#__PURE__*/React.createElement(ScenarioCard, _extends({
    key: s.title
  }, s, {
    onClick: () => {}
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Pagination, {
    page: page,
    totalPages: 6,
    onChange: setPage
  })));
}
function MembersScreen() {
  const [tab, setTab] = React.useState('all');
  return /*#__PURE__*/React.createElement(Page, {
    title: "\u30E1\u30F3\u30D0\u30FC",
    breadcrumb: [{
      label: 'ホーム'
    }, {
      label: 'メンバー'
    }],
    action: /*#__PURE__*/React.createElement(Button, {
      icon: "add",
      variant: "secondary"
    }, "\u30E1\u30F3\u30D0\u30FC\u3092\u62DB\u5F85")
  }, /*#__PURE__*/React.createElement(Tabs, {
    active: tab,
    onChange: setTab,
    tabs: [{
      id: 'all',
      label: 'すべて',
      count: MEMBERS.length
    }, {
      id: 'gm',
      label: 'GM 経験あり',
      count: 1
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-3)'
    }
  }, (tab === 'gm' ? MEMBERS.filter(m => m.role === 'GM') : MEMBERS).map(m => /*#__PURE__*/React.createElement(MemberCard, _extends({
    key: m.handle
  }, m, {
    onMore: () => {}
  })))), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "\u62DB\u5F85\u30EA\u30F3\u30AF"), /*#__PURE__*/React.createElement("span", {
    className: "ds-caption"
  }, "\u30EA\u30F3\u30AF\u3092\u77E5\u3063\u3066\u3044\u308B\u4EBA\u304C\u5353\u306B\u53C2\u52A0\u3067\u304D\u307E\u3059\u30027\u65E5\u9593\u6709\u52B9\u3067\u3059\u3002")), /*#__PURE__*/React.createElement(TextInput, {
    value: "https://taku-biyori.app/i/8fk2",
    style: {
      maxWidth: 280
    },
    readOnly: true
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "link"
  }, "\u30B3\u30D4\u30FC")));
}
Object.assign(window, {
  ScenarioScreen,
  MembersScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/taku-biyori-app/ScenarioScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/taku-biyori-app/ScheduleScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Card,
  CardHeader,
  ScheduleCard,
  Badge,
  Alert,
  Radio,
  Checkbox,
  Switch,
  Avatar,
  Icon,
  Tooltip,
  IconButton,
  DateInput,
  FormField,
  Spinner
} = window.DesignSystem_9512d8;
const VALUES = [{
  v: 'ok',
  l: '○ 参加できる'
}, {
  v: 'maybe',
  l: '△ 未定'
}, {
  v: 'no',
  l: '× 参加できない'
}];
function ScheduleScreen({
  onToast
}) {
  const [answers, setAnswers] = React.useState({
    22: 'ok',
    29: null
  });
  const [saving, setSaving] = React.useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onToast('日程の回答を送信しました', 'GM に通知が届きます');
    }, 800);
  };
  return /*#__PURE__*/React.createElement(Page, {
    title: "\u65E5\u7A0B\u8ABF\u6574",
    breadcrumb: [{
      label: 'ホーム'
    }, {
      label: '日程調整'
    }],
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "add"
    }, "\u5019\u88DC\u65E5\u3092\u8FFD\u52A0")
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    title: "\u300C\u6C34\u66DC\u306E\u306A\u3089\u3057\u5353\u300D\u306E\u65E5\u7A0B\u3092\u8ABF\u6574\u3057\u3066\u3044\u307E\u3059"
  }, "3\u670820\u65E5\u307E\u3067\u306B\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u56DE\u7B54\u306F\u5F8C\u304B\u3089\u5909\u66F4\u3067\u304D\u307E\u3059\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 'var(--space-6)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    label: "Candidates",
    title: "\u5019\u88DC\u65E5"
  }), CANDIDATES.map(c => /*#__PURE__*/React.createElement(ScheduleCard, _extends({
    key: c.date
  }, c, {
    total: 5
  }))), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(CardHeader, {
    title: "\u3042\u306A\u305F\u306E\u56DE\u7B54",
    subtitle: "\u5019\u88DC\u65E5\u3054\u3068\u306B\u9078\u3093\u3067\u304F\u3060\u3055\u3044"
  }), [{
    d: '22',
    t: '3月22日(金) 19:30〜'
  }, {
    d: '29',
    t: '3月29日(金) 19:30〜'
  }].map(row => /*#__PURE__*/React.createElement("div", {
    key: row.d,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      paddingTop: 'var(--space-3)',
      borderTop: 'var(--border-width) solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, row.t), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-5)',
      flexWrap: 'wrap'
    }
  }, VALUES.map(o => /*#__PURE__*/React.createElement(Radio, {
    key: o.v,
    name: 'd' + row.d,
    label: o.l,
    checked: answers[row.d] === o.v,
    onChange: () => setAnswers({
      ...answers,
      [row.d]: o.v
    })
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      paddingTop: 'var(--space-3)',
      borderTop: 'var(--border-width) solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: true,
    label: "\u56DE\u7B54\u3092\u7DE0\u3081\u5207\u3063\u305F\u3089\u901A\u77E5\u3059\u308B"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), saving && /*#__PURE__*/React.createElement(Spinner, {
    size: 16
  }), /*#__PURE__*/React.createElement(Button, {
    loading: saving,
    onClick: save
  }, "\u56DE\u7B54\u3092\u9001\u4FE1")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "\u56DE\u7B54\u72B6\u6CC1"), MEMBERS.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.handle,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m.name,
    size: 26
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--text-body-sm)'
    }
  }, m.name), /*#__PURE__*/React.createElement(Badge, {
    status: m.answered,
    size: "sm"
  })))), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "\u7DE0\u3081\u5207\u308A"), /*#__PURE__*/React.createElement(FormField, {
    helper: "\u3053\u306E\u65E5\u3092\u904E\u304E\u308B\u3068\u56DE\u7B54\u3067\u304D\u306A\u304F\u306A\u308A\u307E\u3059"
  }, /*#__PURE__*/React.createElement(DateInput, {
    value: "2026-03-20"
  })), /*#__PURE__*/React.createElement(Checkbox, {
    checked: true,
    label: "\u5168\u54E1\u306E\u56DE\u7B54\u304C\u305D\u308D\u3063\u305F\u3089\u81EA\u52D5\u3067\u78BA\u5B9A"
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      background: 'var(--primary-subtle)',
      borderColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      font: 'var(--text-label)',
      color: 'var(--primary-on-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sun",
    size: 16
  }), "\u3044\u3061\u3070\u3093\u96C6\u307E\u308A\u3084\u3059\u3044\u65E5"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--primary-on-subtle)'
    }
  }, "3\u670820\u65E5(\u6C34) 13:00\u301C"), /*#__PURE__*/React.createElement("span", {
    className: "ds-caption",
    style: {
      color: 'var(--primary-on-subtle)'
    }
  }, "5\u4EBA\u4E2D4\u4EBA\u304C\u53C2\u52A0\u3067\u304D\u307E\u3059"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    style: {
      marginTop: 8
    },
    onClick: () => onToast('この日で確定しました', 'メンバーに通知しました')
  }, "\u3053\u306E\u65E5\u3067\u78BA\u5B9A\u3059\u308B")))));
}
Object.assign(window, {
  ScheduleScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/taku-biyori-app/ScheduleScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/taku-biyori-app/SessionDetailScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Tabs,
  Badge,
  Chip,
  Button,
  IconButton,
  Icon,
  Card,
  CardHeader,
  MemberCard,
  Textarea,
  Alert,
  Avatar,
  AvatarGroup,
  Tooltip,
  Dialog
} = window.DesignSystem_9512d8;
function SessionDetailScreen({
  onNavigate,
  onToast
}) {
  const [tab, setTab] = React.useState('overview');
  const [confirm, setConfirm] = React.useState(false);
  const s = SESSIONS[0];
  return /*#__PURE__*/React.createElement(Page, {
    title: s.title,
    breadcrumb: [{
      label: 'ホーム'
    }, {
      label: '卓'
    }, {
      label: s.title
    }],
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 'var(--space-2)'
      }
    }, /*#__PURE__*/React.createElement(Tooltip, {
      label: "\u62DB\u5F85\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "link",
      label: "\u62DB\u5F85\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC",
      variant: "secondary",
      onClick: () => onToast('招待リンクをコピーしました', '7日間有効です')
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "edit"
    }, "\u7DE8\u96C6"), /*#__PURE__*/React.createElement(Button, {
      variant: "accent",
      icon: "check",
      onClick: () => onToast('参加を回答しました', 'GM に通知が届きます')
    }, "\u53C2\u52A0\u3059\u308B"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginTop: -12
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: s.status,
    dot: true
  }), /*#__PURE__*/React.createElement(Badge, {
    status: s.role,
    size: "sm"
  }), /*#__PURE__*/React.createElement(Chip, {
    size: "sm",
    icon: "scenario"
  }, s.scenario)), /*#__PURE__*/React.createElement(Tabs, {
    active: tab,
    onChange: setTab,
    tabs: [{
      id: 'overview',
      label: '概要'
    }, {
      id: 'members',
      label: 'メンバー',
      count: 5
    }, {
      id: 'memo',
      label: 'メモ'
    }]
  }), tab === 'overview' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr',
      gap: 'var(--space-6)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(CardHeader, {
    title: "\u3053\u306E\u5353\u306B\u3064\u3044\u3066"
  }), /*#__PURE__*/React.createElement("p", {
    className: "ds-body"
  }, "\u9589\u9928\u5F8C\u306E\u56F3\u66F8\u9928\u3067\u3001\u3072\u3068\u3064\u306E\u79D8\u5BC6\u3092\u3081\u3050\u308B\u7269\u8A9E\u3002\u306F\u3058\u3081\u3066\u306E\u65B9\u3067\u3082\u5927\u4E08\u592B\u3067\u3059\u3002\u958B\u59CB10\u5206\u524D\u306B\u304A\u96C6\u307E\u308A\u304F\u3060\u3055\u3044\u3002\u30DC\u30A4\u30B9\u30C1\u30E3\u30C3\u30C8\u306F Discord \u3092\u4F7F\u3044\u307E\u3059\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-4)',
      paddingTop: 'var(--space-4)',
      borderTop: 'var(--border-width) solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u958B\u50AC\u65E5\u6642",
    value: s.datetime,
    icon: "schedule"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "\u5834\u6240",
    value: s.place,
    icon: "place"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "\u5B9A\u54E1",
    value: `${s.players.length} / ${s.capacity} 人`,
    icon: "members"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "\u6240\u8981\u6642\u9593",
    value: "\u7D043\u6642\u9593",
    icon: "clock"
  }))), /*#__PURE__*/React.createElement(Alert, {
    tone: "info",
    title: "\u3053\u306E\u30B7\u30CA\u30EA\u30AA\u306F\u518D\u6F14\u4E0D\u53EF\u3067\u3059"
  }, "\u4E00\u5EA6\u30D7\u30EC\u30A4\u3057\u305F\u65B9\u306F\u3001\u540C\u3058\u5353\u306B\u53C2\u52A0\u3067\u304D\u307E\u305B\u3093\u3002")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "\u30B7\u30CA\u30EA\u30AA"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      flex: 'none',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--sky-scene)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--sky-800)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "scenario",
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body)',
      fontWeight: 'var(--weight-medium)'
    }
  }, s.scenario), /*#__PURE__*/React.createElement("span", {
    className: "ds-caption"
  }, "\u9727\u5D0E\u3042\u304A \xB7 4\u301C5\u4EBA \xB7 \u7D043\u6642\u9593"))), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconRight: "external-link",
    onClick: () => onNavigate('scenario')
  }, "\u30B7\u30CA\u30EA\u30AA\u3092\u898B\u308B")), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "\u53C2\u52A0\u30E1\u30F3\u30D0\u30FC"), /*#__PURE__*/React.createElement(AvatarGroup, {
    names: s.players,
    size: 32
  }), /*#__PURE__*/React.createElement("span", {
    className: "ds-caption"
  }, "\u3042\u30682\u4EBA\u52DF\u96C6\u3057\u3066\u3044\u307E\u3059")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "delete",
    onClick: () => setConfirm(true),
    style: {
      color: 'var(--error)'
    }
  }, "\u3053\u306E\u5353\u3092\u4E2D\u6B62\u3059\u308B"))), tab === 'members' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      maxWidth: 640
    }
  }, MEMBERS.map(m => /*#__PURE__*/React.createElement(MemberCard, _extends({
    key: m.handle
  }, m, {
    onMore: () => {}
  })))), tab === 'memo' && /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      maxWidth: 640
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "GM \u30E1\u30E2\uFF08\u53C2\u52A0\u8005\u306B\u306F\u8868\u793A\u3055\u308C\u307E\u305B\u3093\uFF09"), /*#__PURE__*/React.createElement(Textarea, {
    rows: 6,
    maxLength: 400,
    defaultValue: '・開始10分前に集合\n・BGM は控えめに\n・エンディング後に感想戦を15分'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary",
    size: "sm"
  }, "\u7834\u68C4"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => onToast('メモを保存しました')
  }, "\u4FDD\u5B58\u3059\u308B"))), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    tone: "danger",
    title: "\u3053\u306E\u5353\u3092\u4E2D\u6B62\u3057\u307E\u3059\u304B\uFF1F",
    message: "\u53C2\u52A0\u30E1\u30F3\u30D0\u30FC5\u4EBA\u306B\u901A\u77E5\u304C\u5C4A\u304D\u307E\u3059\u3002\u3053\u306E\u64CD\u4F5C\u306F\u53D6\u308A\u6D88\u305B\u307E\u305B\u3093\u3002",
    confirmLabel: "\u4E2D\u6B62\u3059\u308B",
    onConfirm: () => {
      setConfirm(false);
      onToast('卓を中止しました', 'メンバーに通知しました');
    },
    onCancel: () => setConfirm(false)
  }));
}
function Field({
  label,
  value,
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-caption"
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      font: 'var(--text-body-sm)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16,
    style: {
      color: 'var(--text-tertiary)'
    }
  }), value));
}
Object.assign(window, {
  SessionDetailScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/taku-biyori-app/SessionDetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/taku-biyori-app/SessionListScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Tabs,
  Chip,
  Button,
  TextInput,
  SessionCard,
  Pagination,
  SkeletonCard,
  EmptyState
} = window.DesignSystem_9512d8;
function SessionListScreen({
  onNavigate,
  onCreate
}) {
  const [tab, setTab] = React.useState('all');
  const [filter, setFilter] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const shown = React.useMemo(() => {
    let out = SESSIONS;
    if (tab === 'open') out = out.filter(s => s.status === '募集中');
    if (tab === 'done') out = out.filter(s => s.status === '完了');
    if (tab === 'mine') out = out.filter(s => s.role === 'GM');
    if (filter === 'online') out = out.filter(s => (s.place || '').includes('オンライン'));
    if (filter === 'beginner') out = out.filter(s => s.scenario === 'はじめての捜査');
    return out;
  }, [tab, filter]);
  const reload = next => {
    setTab(next);
    setLoading(true);
    setTimeout(() => setLoading(false), 700);
  };
  return /*#__PURE__*/React.createElement(Page, {
    title: "\u5353",
    breadcrumb: [{
      label: 'ホーム'
    }, {
      label: '卓'
    }],
    action: /*#__PURE__*/React.createElement(Button, {
      icon: "add",
      onClick: onCreate
    }, "\u5353\u3092\u3064\u304F\u308B")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    active: tab,
    onChange: reload,
    tabs: [{
      id: 'all',
      label: 'すべて',
      count: SESSIONS.length
    }, {
      id: 'open',
      label: '募集中',
      count: 1
    }, {
      id: 'mine',
      label: '自分がGM',
      count: 1
    }, {
      id: 'done',
      label: '完了',
      count: 1
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    icon: "search",
    placeholder: "\u5353\u540D\u30FB\u30B7\u30CA\u30EA\u30AA\u3067\u691C\u7D22",
    style: {
      maxWidth: 280
    }
  }), /*#__PURE__*/React.createElement(Chip, {
    icon: "filter",
    selected: filter === 'online',
    onClick: () => setFilter(filter === 'online' ? null : 'online')
  }, "\u30AA\u30F3\u30E9\u30A4\u30F3"), /*#__PURE__*/React.createElement(Chip, {
    selected: filter === 'beginner',
    onClick: () => setFilter(filter === 'beginner' ? null : 'beginner')
  }, "\u521D\u5FC3\u8005\u6B53\u8FCE"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ds-caption"
  }, shown.length, " \u4EF6"))), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(SkeletonCard, null), /*#__PURE__*/React.createElement(SkeletonCard, null), /*#__PURE__*/React.createElement(SkeletonCard, null), /*#__PURE__*/React.createElement(SkeletonCard, null)) : shown.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "session",
    title: "\u6761\u4EF6\u306B\u5408\u3046\u5353\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093",
    description: "\u7D5E\u308A\u8FBC\u307F\u3092\u5916\u3059\u304B\u3001\u5225\u306E\u30AD\u30FC\u30EF\u30FC\u30C9\u3067\u63A2\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setFilter(null)
    }, "\u7D5E\u308A\u8FBC\u307F\u3092\u89E3\u9664")
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-4)'
    }
  }, shown.map(s => /*#__PURE__*/React.createElement(SessionCard, _extends({
    key: s.id
  }, s, {
    onClick: () => onNavigate('detail'),
    onAction: () => onNavigate('detail')
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Pagination, {
    page: page,
    totalPages: 4,
    onChange: setPage
  })));
}
Object.assign(window, {
  SessionListScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/taku-biyori-app/SessionListScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/taku-biyori-app/data.jsx
try { (() => {
const {
  GlobalNav,
  Tabs,
  Breadcrumb,
  Pagination,
  Button,
  IconButton,
  Icon,
  Logo,
  SkyScene,
  Card,
  CardHeader,
  SessionCard,
  ScenarioCard,
  ScheduleCard,
  MemberCard,
  Badge,
  Chip,
  Avatar,
  AvatarGroup,
  FormField,
  TextInput,
  Textarea,
  Select,
  DateInput,
  Checkbox,
  Radio,
  Switch,
  Alert,
  Toast,
  ToastStack,
  Modal,
  Dialog,
  Tooltip,
  EmptyState,
  Spinner,
  Skeleton,
  SkeletonCard
} = window.DesignSystem_9512d8;
const SESSIONS = [{
  id: 1,
  title: '金曜夜の卓',
  scenario: '星降る夜の図書館',
  status: '募集中',
  role: 'GM',
  datetime: '3月22日(金) 19:30〜',
  place: 'オンライン (Discord)',
  players: ['さくら', 'ゆう', 'けい'],
  capacity: 5
}, {
  id: 2,
  title: '春分の会',
  scenario: '灰色の海辺にて',
  status: '開催予定',
  role: 'PL',
  datetime: '3月20日(水) 13:00〜',
  place: '中野・レンタルスペース flat',
  players: ['みなと', 'あお', 'りん', 'さくら'],
  capacity: 4
}, {
  id: 3,
  title: '水曜のならし卓',
  scenario: 'はじめての捜査',
  status: '調整中',
  datetime: '候補日 3件',
  place: 'オンライン',
  players: ['ゆう', 'けい'],
  capacity: 6
}, {
  id: 4,
  title: '２月の卓',
  scenario: '硝子の温室',
  status: '完了',
  role: 'PL',
  datetime: '2月11日(日) 14:00〜',
  place: '新宿・卓ラウンジ',
  players: ['さくら', 'ゆう', 'みなと', 'あお'],
  capacity: 4
}];
const SCENARIOS = [{
  title: '星降る夜の図書館',
  author: '霧崎あお',
  playerCount: '4〜5人',
  duration: '約3時間',
  tags: ['マーダーミステリー', '初心者歓迎', 'オンライン可'],
  note: '閉館後の図書館で、ひとつの秘密をめぐる物語。'
}, {
  title: '灰色の海辺にて',
  author: '南雲ひかり',
  playerCount: '4人',
  duration: '約4時間',
  tags: ['マーダーミステリー', '経験者向け'],
  note: '小さな港町。三日前に消えた灯台守を探しています。'
}, {
  title: 'はじめての捜査',
  author: 'たく日和編集部',
  playerCount: '3〜6人',
  duration: '約90分',
  tags: ['TRPG', '初心者歓迎'],
  note: 'ルール説明つき。はじめての一卓に。'
}, {
  title: '硝子の温室',
  author: '柊 みなと',
  playerCount: '5人',
  duration: '約3.5時間',
  tags: ['マーダーミステリー', '再演不可'],
  note: '冬の植物園で、招かれた五人が一夜を過ごします。'
}];
const MEMBERS = [{
  name: 'さくら',
  handle: 'sakura',
  role: 'GM',
  sessions: 12,
  lastActive: '3日前に参加',
  answered: '回答済み'
}, {
  name: 'ゆう',
  handle: 'yuu',
  role: 'PL',
  sessions: 9,
  lastActive: '昨日ログイン',
  answered: '回答済み'
}, {
  name: 'けい',
  handle: 'kei',
  role: 'PL',
  sessions: 4,
  lastActive: '1週間前',
  answered: '未回答'
}, {
  name: 'みなと',
  handle: 'minato',
  role: 'PL',
  sessions: 21,
  lastActive: '今日ログイン',
  answered: '回答済み'
}, {
  name: 'あお',
  handle: 'ao',
  role: 'PL',
  sessions: 7,
  lastActive: '2日前',
  answered: '未回答'
}];
const CANDIDATES = [{
  date: '20',
  weekday: '3月 水',
  time: '13:00〜',
  status: '開催予定',
  responses: [{
    name: 'さくら',
    value: 'ok'
  }, {
    name: 'ゆう',
    value: 'ok'
  }, {
    name: 'けい',
    value: 'ok'
  }, {
    name: 'みなと',
    value: 'ok'
  }, {
    name: 'あお',
    value: 'maybe'
  }],
  answered: 5
}, {
  date: '22',
  weekday: '3月 金',
  time: '19:30〜',
  status: '調整中',
  responses: [{
    name: 'さくら',
    value: 'ok'
  }, {
    name: 'ゆう',
    value: 'maybe'
  }, {
    name: 'けい',
    value: 'no'
  }, {
    name: 'みなと',
    value: null
  }, {
    name: 'あお',
    value: null
  }],
  answered: 3
}, {
  date: '29',
  weekday: '3月 金',
  time: '19:30〜',
  status: '調整中',
  responses: [{
    name: 'さくら',
    value: 'ok'
  }, {
    name: 'ゆう',
    value: 'ok'
  }, {
    name: 'けい',
    value: 'maybe'
  }, {
    name: 'みなと',
    value: null
  }, {
    name: 'あお',
    value: null
  }],
  answered: 3
}];
function Page({
  title,
  breadcrumb,
  action,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-lg)',
      margin: '0 auto',
      padding: 'var(--space-8) var(--space-6) var(--space-16)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)'
    }
  }, breadcrumb && /*#__PURE__*/React.createElement(Breadcrumb, {
    items: breadcrumb
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "ds-h1",
    style: {
      flex: 1
    }
  }, title), action), children);
}
function SectionHead({
  label,
  title,
  more
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "ds-overline"
  }, label), /*#__PURE__*/React.createElement("h2", {
    className: "ds-h2"
  }, title)), more && /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconRight: "chevron-right",
    onClick: more
  }, "\u3059\u3079\u3066\u898B\u308B"));
}
Object.assign(window, {
  SESSIONS,
  SCENARIOS,
  MEMBERS,
  CANDIDATES,
  Page,
  SectionHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/taku-biyori-app/data.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.SkyScene = __ds_scope.SkyScene;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ICON_ALIASES = __ds_scope.ICON_ALIASES;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.STATUS_TONES = __ds_scope.STATUS_TONES;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.MemberCard = __ds_scope.MemberCard;

__ds_ns.ScenarioCard = __ds_scope.ScenarioCard;

__ds_ns.ScheduleCard = __ds_scope.ScheduleCard;

__ds_ns.SessionCard = __ds_scope.SessionCard;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.SkeletonCard = __ds_scope.SkeletonCard;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastStack = __ds_scope.ToastStack;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.DateInput = __ds_scope.DateInput;

__ds_ns.FormField = __ds_scope.FormField;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.GlobalNav = __ds_scope.GlobalNav;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
