"use strict";

// ======================================================================
// PHOTO PAINT STUDIO (Port of Paint02.py, Paint_Shape.py, Paint_Helper.py, Paint_Emoji.py)
// ======================================================================

const PAINT_HANDLE_SIZE = 10;

// Lazy-Loader for PolyBoolJS (Loaded on demand so startup is never slowed down)
let polyBoolLoadPromise = null;
function ensurePolyBoolLoaded() {
    if (window.PolyBool) return Promise.resolve(window.PolyBool);
    if (polyBoolLoadPromise) return polyBoolLoadPromise;

    polyBoolLoadPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/polybooljs@1.2.2/dist/polybool.min.js";
        script.async = true;
        script.onload = () => resolve(window.PolyBool || null);
        script.onerror = () => {
            console.warn("Could not load polybooljs from CDN; boolean ops unavailable.");
            polyBoolLoadPromise = null;
            resolve(null);
        };
        document.head.appendChild(script);
    });
    return polyBoolLoadPromise;
}

// ======================================================================
// EMOJI & COUNTRY FLAG DATA (Ported from Paint_Emoji.py)
// ======================================================================
const PAINT_EMOJI_CATEGORIES = {
    "🙂": [
        "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳",
        "😏","😒","😞","😔","😟","😕","🙁","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥",
        "😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻",
        "💀","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾","👑","🎩","🎓","🧢","🪖","⛑️","👓","🕶️","🥽","🧣","👔","👕","🧥","👗","👘","👙","🎒","💎"
    ],
    "🥷": [
        "👶","🧒","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","👮","🕵️","💂","🥷","👷","🫅","👳","👲","🧕","🤵","👰","🤰","👼","🎅","🤶","🦸","🦹","🧙","🧚","🧛","🧜",
        "🧝","🧞","🧟","💆","💇","🚶","🧍","🧎","🏃","💃","🕺","🕴️","👯","🧖","🧗","🤺","🏇","⛷️","🏂","🏌️","🏄","🚣","🏊","⛹️","🏋️","🚴","🚵","🤸","🤼","🤽","🤾","🤹",
        "🧘","💪","🦵","🦶","👂","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️",
        "👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳"
    ],
    "🦊": [
        "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺",
        "🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬",
        "🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈",
        "🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲"
    ],
    "🍎": [
        "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠",
        "🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝",
        "🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜",
        "🍯","🥛","🍼","🫖","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","💐","🌸","💮","🏵️","🌹","🥀","🌺","🌻","🌼","🌷","🌱","🪴",
        "🌲","🌳","🌴","🌵","🌾","🌿","☘️","🍀","🍁","🍂","🍃","🍄"
    ],
    "🏀": [
        "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌",
        "🎿","🎯","🪄","🔮","🎮","🕹️","🎰","🎲","🧩","🧸","🪅","🪩","🪆","♠️","♥️","♦️","♣️","♟️","🃏","🀄","🎴","🎭","🖼️","🎨","🧵","🪡","🧶","🪢","🎃","🎄","🎆","🎇",
        "🧨","✨","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🎐","🎑","🧧","🎀","🎁","🎗️","🎟️","🎫","🎖️","🏆","🏅","🥇","🥈","🥉"
    ],
    "✈️": [
        "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲","🛴","🛹","🛼","🚁","🛸","✈️","🛩️","🛫","🛬","🪂","💺","🚀","🛰️","🚂","🚃",
        "🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","⚓","⛵","🛶","🚤","🛳️","⛴️","🛥️","🚢","🛟","⛽","🚧","🚦","🚥","🚏","🗺️","🗿","🗽","🗼",
        "🏰","🏯","🏟️","🎡","🎢","🎠","⛲","⛱️","🏖️","🏝️","🏜️","🌋","⛰️","🏔️","🗻","🏕️","⛺","🏠","🏡","🏢","🏣","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏮","🧱","🪨"
    ],
    "🌎": [
        "🌍","🌎","🌏","🌐","🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌙","🌚","🌛","🌜","☀️","🌝","🌞","🪐","⭐","🌟","🌠","🌌","☁️","⛅","⛈️","🌤️","🌥️","🌦️","🌧️","🌨️",
        "🌩️","🌪️","🌫️","🌬️","🌀","🌈","🌂","☂️","☔","⛱️","⚡","❄️","☃️","⛄","☄️","🔥","💧","🌊","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎"
    ],
    "🎥": [
        "🎥","🎞️","📽️","🎬","📺","📷","📸","📹","📼","🔍","🔎","🕯️","💡","🔦","🏮","🎷","🪗","🎸","🎹","🎺","🎻","🪕","🥁","🪘","🎼","🎵","🎶","🎙️","🎚️","🎛️","🎤","🎧",
        "📻","🔈","🔉","🔊","📢","📣","📯","🔔","🔕","🔨","🪓","⛏️","⚒️","🛠️","🗡️","⚔️","💣","🪃","🏹","🛡️","🪚","🔧","🪛","🔩","⚙️","🗜️","⚖️","🦯","🔗","⛓️","🪝","🧰","🧲","🪜"
    ],
    "🔬": [
        "⚗️","🧪","🧫","🧬","🔬","🔭","📡","💉","🩸","💊","🩹","🩼","🩺","🩻","🚪","🛗","🪞","🪟","🛏️","🛋️","🪑","🚽","🪠","🚿","🛁","🪤","🪒","🧴","🧷","🧹","🧺","🧻",
        "🪣","🧼","🫧","🪥","🧽","🧯","🛒","🔋","🪫","🔌","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💽","💾","💿","📀","🧮","📱","📲","☎️","📞","📟","📠","📦","📫","📮","🔒","🔓","🔑","🗝️"
    ],
    "📝": [
        "✏️","✒️","🖋️","🖊️","🖌️","🖍️","📝","📕","📗","📘","📙","📚","📓","📒","📃","📜","📄","📰","🗞️","📑","🔖","🏷️","💰","🪙","💴","💵","💶","💷","💸","💳","🧾","💹",
        "✉️","📧","📨","📩","📤","📥","📦","📫","📪","📬","📭","📮","🗳️","📅","📆","🗒️","🗓️","📇","📈","📉","📊","📋","📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️","💼","📁","📂","🗂️"
    ],
    "💙": [
        "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","⚪","🟥","🟧","🟨","🟩",
        "🟦","🟪","🟫","⬛","⬜","🔶","🔷","🔸","🔹","🔺","🔻","💠","🔘","🔳","🔲","💯","💢","💥","💫","💦","💨","🕳️","💬","👁️‍🗨️","🗨️","🗯️","💭","💤","✨","🌟","⭐","⚡","🔥",
        "✅","☑️","✔️","❌","❎","➕","➖","➗","✖️","🟰","♾️","❓","❔","❕","❗","〰️","©️","®️","™️"
    ],
    "◀️": [
        "⬆️","↗️","➡️","↘️","⬇️","↙️","⬅️","↖️","↕️","↔️","↩️","↪️","⤴️","⤵️","🔃","🔄","🔙","🔚","🔛","🔜","🔝","▶️","⏩","⏭️","⏯️","◀️","⏪","⏮️","🔼","⏫","🔽","⏬",
        "⏸️","⏹️","⏺️","⏏️","🎦","🔀","🔁","🔂","🔅","🔆","📶","📳","📴","♻️","⚜️","🔱","📛","🔰","⭕","⚠️","🚸","⛔","🚫","🚳","🚭","🚯","🚱","🚷","📵","🔞","☢️","☣️",
        "☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⚛️","#️⃣","*️⃣","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔠","🔡","🔢","🔣","🔤","🅰️","🆎","🅱️","🆑","🆒","🆓","ℹ️","🆔","Ⓜ️","🆕","🆖","🅾️","🆗","🅿️","🆘","🆙","🆚"
    ]
};

const PAINT_COUNTRY_DATA = {
    "Western European & N. America": {
        "United States": [333287500, "🇺🇸"], "European Union": [447000000, "🇪🇺"], "Germany": [83369800, "🇩🇪"],
        "France": [67936100, "🇫🇷"], "United Kingdom": [67508900, "🇬🇧"], "Italy": [58983000, "🇮🇹"],
        "Spain": [47558600, "🇪🇸"], "Canada": [38454300, "🇨🇦"], "Australia": [26177400, "🇦🇺"],
        "Netherlands": [17590600, "🇳🇱"], "Belgium": [11655900, "🇧🇪"], "Sweden": [10481900, "🇸🇪"],
        "Greece": [10432400, "🇬🇷"], "Portugal": [10336200, "🇵🇹"], "Israel": [9506000, "🇮🇱"],
        "Austria": [8939600, "🇦🇹"], "Switzerland": [8740400, "🇨🇭"], "Denmark": [5882200, "🇩🇰"],
        "Finland": [5540700, "🇫🇮"], "Norway": [5426200, "🇳🇴"], "Ireland": [5123500, "🇮🇪"],
        "New Zealand": [5122600, "🇳🇿"], "Iceland": [376200, "🇮🇸"]
    },
    "Eastern European": {
        "Russia": [143400000, "🇷🇺"], "Ukraine": [38000000, "🇺🇦"], "Poland": [37840000, "🇵🇱"],
        "Romania": [19053800, "🇷🇴"], "Czechia": [10493900, "🇨🇿"], "Hungary": [9689000, "🇭🇺"],
        "Serbia": [6834300, "🇷🇸"], "Bulgaria": [6781900, "🇧🇬"], "Slovakia": [5434700, "🇸🇰"],
        "Croatia": [3850800, "🇭🇷"], "Lithuania": [2801000, "🇱🇹"], "Slovenia": [2108700, "🇸🇮"],
        "Latvia": [1875700, "🇱🇻"], "Estonia": [1326000, "🇪🇪"]
    },
    "Asia-Pacific": {
        "India": [1417173100, "🇮🇳"], "China": [1412175000, "🇨🇳"], "Indonesia": [275501300, "🇮🇩"],
        "Pakistan": [235824800, "🇵🇰"], "Bangladesh": [171186300, "🇧🇩"], "Japan": [125124900, "🇯🇵"],
        "Philippines": [115559000, "🇵🇭"], "Vietnam": [98186800, "🇻🇳"], "Iran": [88550500, "🇮🇷"],
        "Turkey": [85279500, "🇹🇷"], "Thailand": [71697000, "🇹🇭"], "South Korea": [51439000, "🇰🇷"],
        "Iraq": [44496100, "🇮🇶"], "Saudi Arabia": [36408800, "🇸🇦"], "Malaysia": [33938200, "🇲🇾"],
        "Nepal": [30547500, "🇳🇵"], "Taiwan": [23893300, "🇹🇼"], "Sri Lanka": [21832100, "🇱🇰"],
        "Kazakhstan": [19644000, "🇰🇿"], "United Arab Emirates": [9441100, "🇦🇪"], "Singapore": [5637000, "🇸🇬"]
    },
    "Latin American": {
        "Brazil": [215313400, "🇧🇷"], "Mexico": [127504100, "🇲🇽"], "Colombia": [51874000, "🇨🇴"],
        "Argentina": [46234800, "🇦🇷"], "Peru": [34049500, "🇵🇪"], "Venezuela": [28301600, "🇻🇪"],
        "Chile": [19603700, "🇨🇱"], "Ecuador": [18001000, "🇪🇨"], "Guatemala": [17843900, "🇬🇹"],
        "Bolivia": [12224100, "🇧🇴"], "Cuba": [11212100, "🇨🇺"], "Costa Rica": [5180800, "🇨🇷"],
        "Panama": [4408500, "🇵🇦"], "Uruguay": [3422700, "🇺🇾"], "Jamaica": [2827300, "🇯🇲"], "Puerto Rico": [3221700, "🇵🇷"]
    },
    "African": {
        "Nigeria": [218541200, "🇳🇬"], "Ethiopia": [123379900, "🇪🇹"], "Egypt": [110990100, "🇪🇬"],
        "DR Congo": [99010000, "🇨🇩"], "Tanzania": [65497700, "🇹🇿"], "South Africa": [60604900, "🇿🇦"],
        "Kenya": [54027400, "🇰🇪"], "Uganda": [47249500, "🇺🇬"], "Algeria": [44903200, "🇩🇿"],
        "Morocco": [37457900, "🇲🇦"], "Ghana": [33475800, "🇬🇭"], "Cameroon": [27914500, "🇨🇲"],
        "Senegal": [17316400, "🇸🇳"], "Zimbabwe": [16320500, "🇿🇼"], "Tunisia": [12356100, "🇹🇳"]
    },
    "Other Flags": {
        "United Nations": [0, "🇺🇳"], "Checkered": [0, "🏁"], "Triangular Flag": [0, "🚩"],
        "Crossed Flags": [0, "🎌"], "Black Flag": [0, "🏴"], "White Flag": [0, "🏳️"],
        "Rainbow Flag": [0, "🏳️‍🌈"], "Pirate Flag": [0, "🏴‍☠️"], "Antarctica": [0, "🇦🇶"]
    }
};

// ======================================================================
// FONT CATEGORIES & SHAPE PARAMETER DEFINITIONS (Ported from Paint_Shape.py)
// ======================================================================
const PAINT_FONT_CATEGORIES = {
    "Modern": ["Inter", "Arial", "Segoe UI", "Roboto", "Helvetica", "Verdana", "Trebuchet MS", "Ubuntu", "Gill Sans", "Optima"],
    "Serif": ["Georgia", "Times New Roman", "Garamond", "Palatino", "Bookman", "Baskerville", "Cambria", "Didot"],
    "Mono": ["JetBrains Mono", "Fira Code", "Consolas", "Courier New", "Monaco", "Lucida Console", "Ubuntu Mono"],
    "Fancy": ["Impact", "Copperplate", "Papyrus", "Brush Script MT", "Comic Sans MS", "Snell Roundhand", "Chancery", "Stencil"],
    "Symbol": ["Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Symbol", "Wingdings"]
};

function getPaintShapeParamsConfig() {
    const config = {
        "Line": [
            ["Minimum Distance", 0, 50, 12],
            ["Corner Radius (%)", 0, 100, 30],
            ["Line Angles", "choice", ["Freehand", "30° Snap", "45° Snap", "90° Snap"]],
            ["Show Arrow", "toggle", "Show Arrow Head", false],
            ["Head Length (%)", 10, 100, 60],
            ["Head Inset (%)", 0, 100, 15]
        ],
        "Triangle": [
            ["Allow Obtuse", "bool", false],
            ["Top Shift (%)", -50, 50, 0],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Rectangle": [
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Equilateral Polygon": [
            ["Number of Sides", 3, 24, 5],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Circle": [
            ["Hole (%)", 0, 90, 0]
        ],
        "Ellipse": [
            ["Aspect Ratio (%)", 30, 100, 70],
            ["Hole (%)", 0, 90, 0]
        ],
        "Crescent": [
            ["Arch (Degrees)", 15, 360, 180],
            ["Hole (%)", -95, 95, 50]
        ],
        "Plus": [
            ["Arms", 3, 12, 4],
            ["Thickness (%)", 10, 150, 40],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Star": [
            ["Arms", 3, 20, 5],
            ["Depth (%)", 5, 95, 50],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Cog": [
            ["Teeth", 4, 30, 8],
            ["Radius-1 Outer (%)", 20, 100, 100],
            ["Radius-3 Root (%)", 10, 95, 60],
            ["Splay (%)", 0, 100, 20],
            ["Hole (%)", 0, 90, 40]
        ],
        "Pie Chart": [
            ["Percent Shown (%)", 1, 100, 75],
            ["Hole (%)", 0, 90, 0]
        ],
        "Arrow": [
            ["Base Thickness (%)", 5, 100, 25],
            ["Head Thickness (%)", 20, 150, 55],
            ["Head Length (%)", 10, 90, 40],
            ["Head Inset (%)", -40, 40, 0],
            ["Corner Radius (%)", 0, 100, 0]
        ],
        "Emoji": [
            ["Grayscale", "bool", false],
            ["Emoji", "emoji_grid", "🙂"],
            ["Change", "button", "Open Emoji Selection"]
        ],
        "Fill": [
            ["Fill Tolerance", 1, 100, 18],
            ["Fill Type", "choice", ["Solid Color", "Transparent", "Checkerboard", "Diagonal Stripes", "Polka Dots"]]
        ]
    };

    Object.entries(PAINT_FONT_CATEGORIES).forEach(([cat, fontList]) => {
        config["Font" + cat] = [
            [cat, "font", fontList],
            ["Bold", "toggle", false],
            ["Italic", "toggle", false],
            ["Text Size", 10, 120, 32],
            ["Text Outline", "bool", false],
            ["Background Pill", "bool", false],
            ["Bg Opacity (%)", 10, 100, 65]
        ];
    });

    return config;
}

// ======================================================================
// GEOMETRY & PATH HELPERS (Ported from Paint_Helper.py)
// ======================================================================
function paintTransformPts(pts, cx, cy, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return pts.map(([x, y]) => [
        cx + x * cosA - y * sinA,
        cy + x * sinA + y * cosA
    ]);
}

function paintRotatePt(px, py, cx, cy, theta) {
    const cosA = Math.cos(theta);
    const sinA = Math.sin(theta);
    const dx = px - cx;
    const dy = py - cy;
    return [cx + dx * cosA - dy * sinA, cy + dx * sinA + dy * cosA];
}

function paintCalculateVertexAngle(pts, idx, isClosed = true) {
    const n = pts.length;
    if (n < 2) return null;
    const v = pts[idx];

    if (isClosed || (idx > 0 && idx < n - 1)) {
        const pPrev = pts[(idx - 1 + n) % n];
        const pNext = pts[(idx + 1) % n];
        const v1 = [pPrev[0] - v[0], pPrev[1] - v[1]];
        const v2 = [pNext[0] - v[0], pNext[1] - v[1]];
        const ang1 = Math.atan2(v1[1], v1[0]);
        const ang2 = Math.atan2(v2[1], v2[0]);
        let diff = Math.abs(ang1 - ang2) * (180 / Math.PI);
        if (diff > 180) diff = 360 - diff;
        return diff;
    } else {
        const otherIdx = idx === 0 ? 1 : n - 2;
        const pOther = pts[otherIdx];
        const dx = v[0] - pOther[0];
        const dy = v[1] - pOther[1];
        return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    }
}

function getShapeVertices(shapeType, params, R) {
    if (R <= 0) return [];

    if (shapeType === "Triangle") {
        const shift = (params["Top Shift (%)"] ?? 0) / 100.0;
        const allowObtuse = !!params["Allow Obtuse"];
        let scaleFactor = 1.0;
        if (allowObtuse) {
            const maxAbsX = Math.max(1.0, Math.abs(shift * 2.0));
            if (maxAbsX > 1.1) scaleFactor = 1.1 / maxAbsX;
        }
        const H = R * Math.sqrt(3);
        return [
            [-R * scaleFactor, (H / 2) * scaleFactor],
            [R * scaleFactor, (H / 2) * scaleFactor],
            [shift * R * 2 * scaleFactor, (-H / 2) * scaleFactor]
        ];
    } else if (shapeType === "Rectangle") {
        const w = R * 2.2, h = R * 1.5;
        return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
    } else if (shapeType === "Equilateral Polygon") {
        const sides = Math.max(3, parseInt(params["Number of Sides"] ?? 5, 10));
        const pts = [];
        for (let i = 0; i < sides; i++) {
            const ang = (i * 2 * Math.PI) / sides - Math.PI / 2;
            pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Circle") {
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Ellipse") {
        const aspect = (params["Aspect Ratio (%)"] ?? 70) / 100.0;
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([R * Math.cos(ang), R * aspect * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Star") {
        const depth = (params["Depth (%)"] ?? 50) / 100.0;
        const arms = Math.max(3, parseInt(params["Arms"] ?? 5, 10));
        const innerR = R * (1.0 - depth);
        const pts = [];
        for (let i = 0; i < arms * 2; i++) {
            const rPt = i % 2 === 0 ? R : innerR;
            const ang = (i * Math.PI) / arms - Math.PI / 2;
            pts.push([rPt * Math.cos(ang), rPt * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Plus") {
        const plusArms = Math.max(3, parseInt(params["Arms"] ?? 4, 10));
        const thicknessPct = (params["Thickness (%)"] ?? 40) / 100.0;
        const w = thicknessPct * R * 0.5;
        const armData = [];
        for (let i = 0; i < plusArms; i++) {
            const ang = (i * 2 * Math.PI) / plusArms - Math.PI / 2;
            const ux = Math.cos(ang), uy = Math.sin(ang);
            const vx = -uy, vy = ux;
            armData.push({
                ux, uy,
                tl: [R * ux + w * vx, R * uy + w * vy],
                tr: [R * ux - w * vx, R * uy - w * vy]
            });
        }
        const pts = [];
        for (let i = 0; i < plusArms; i++) {
            const nextI = (i + 1) % plusArms;
            const cur = armData[i];
            const nxt = armData[nextI];
            const dx = cur.tr[0] - nxt.tl[0];
            const dy = cur.tr[1] - nxt.tl[1];
            const det = -cur.ux * nxt.uy + cur.uy * nxt.ux;
            const t = Math.abs(det) > 1e-6 ? (dx * -nxt.uy - dy * -nxt.ux) / det : R;
            pts.push(cur.tl, cur.tr, [cur.tr[0] - t * cur.ux, cur.tr[1] - t * cur.uy]);
        }
        return pts;
    } else if (shapeType === "Arrow") {
        const minR = Math.min(R, 60);
        const bt = ((params["Base Thickness (%)"] ?? 25) / 100.0) * minR;
        const ht = ((params["Head Thickness (%)"] ?? 55) / 100.0) * minR;
        const hl = ((params["Head Length (%)"] ?? 40) / 100.0) * minR;
        const hi = ((params["Head Inset (%)"] ?? 0) / 100.0) * R;
        return [
            [-R, -bt / 2], [R - hl, -bt / 2], [R - hl + hi, -ht / 2],
            [R, 0], [R - hl + hi, ht / 2], [R - hl, bt / 2], [-R, bt / 2]
        ];
    } else if (shapeType === "Pie Chart") {
        const percent = (params["Percent Shown (%)"] ?? 75) / 100.0;
        const holePct = Math.abs(params["Hole (%)"] ?? 0) / 100.0;
        const numSteps = Math.max(8, Math.round(32 * percent));
        const pts = [];
        if (percent < 1.0) {
            if (holePct > 0) {
                for (let i = 0; i <= numSteps; i++) {
                    const ang = -Math.PI / 2 + (percent * 2 * Math.PI * i) / numSteps;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
                for (let i = numSteps; i >= 0; i--) {
                    const ang = -Math.PI / 2 + (percent * 2 * Math.PI * i) / numSteps;
                    pts.push([R * holePct * Math.cos(ang), R * holePct * Math.sin(ang)]);
                }
            } else {
                pts.push([0, 0]);
                for (let i = 0; i <= numSteps; i++) {
                    const ang = -Math.PI / 2 + (percent * 2 * Math.PI * i) / numSteps;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
            }
        } else {
            for (let i = 0; i < 36; i++) {
                const ang = (i * 2 * Math.PI) / 36;
                pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
            }
        }
        return pts;
    } else if (shapeType === "Crescent") {
        const A = ((params["Arch (Degrees)"] ?? 180) * Math.PI) / 180.0;
        const holePct = Math.abs(params["Hole (%)"] ?? 50) / 100.0;
        const pts = [];
        if (A > 0.001) {
            if (A >= 2 * Math.PI - 0.001) {
                for (let i = 0; i < 36; i++) {
                    const ang = (i * 2 * Math.PI) / 36;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
            } else {
                const startAng = -A / 2, endAng = A / 2;
                const numPts = 20;
                for (let i = 0; i <= numPts; i++) {
                    const ang = startAng + ((endAng - startAng) * i) / numPts;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
                const xChord = R * Math.cos(A / 2);
                const yChord = R * Math.sin(A / 2);
                const x3 = xChord + (R - xChord) * holePct;
                if (Math.abs(x3 - xChord) < 1e-5) {
                    pts.push([xChord, -yChord]);
                } else {
                    const cx = (x3 * x3 - R * R) / (2 * (x3 - xChord));
                    const rI = Math.abs(x3 - cx);
                    const aBot = Math.atan2(yChord, xChord - cx);
                    const aTop = Math.atan2(-yChord, xChord - cx);
                    for (let i = 0; i <= numPts; i++) {
                        const ang = aBot + ((aTop - aBot) * i) / numPts;
                        pts.push([cx + rI * Math.cos(ang), rI * Math.sin(ang)]);
                    }
                }
            }
        }
        return pts;
    } else if (shapeType === "Cog") {
        const r1Base = (params["Radius-1 Outer (%)"] ?? 100) / 100.0;
        const r3Base = (params["Radius-3 Root (%)"] ?? 60) / 100.0;
        const splay = (params["Splay (%)"] ?? 20) / 100.0;
        const teeth = Math.max(4, parseInt(params["Teeth"] ?? 8, 10));
        const totalPts = teeth * 4;
        const r1 = r1Base * R, r3 = r3Base * R;
        const pts = [];
        for (let i = 0; i < totalPts; i++) {
            let ang = (i * 2 * Math.PI) / totalPts - Math.PI / 2;
            const mod = i % 4;
            let rCurr = r1;
            if (mod === 0) { rCurr = r1; ang += (Math.PI / totalPts) * splay; }
            else if (mod === 1) { rCurr = r1; ang -= (Math.PI / totalPts) * splay; }
            else if (mod === 2) { rCurr = r3; ang -= (Math.PI / totalPts) * splay; }
            else { rCurr = r3; ang += (Math.PI / totalPts) * splay; }
            pts.push([rCurr * Math.cos(ang), rCurr * Math.sin(ang)]);
        }
        return pts;
    }
    return [];
}

function getShapeHoleVertices(shapeType, params, R) {
    const holePct = Math.abs(params["Hole (%)"] ?? 0) / 100.0;
    if (holePct <= 0.001) return null;

    if (shapeType === "Pie Chart" && (params["Percent Shown (%)"] ?? 75) < 100) {
        return null; // Already part of the single concave wedge contour
    }
    if (shapeType === "Crescent") {
        const A = ((params["Arch (Degrees)"] ?? 180) * Math.PI) / 180.0;
        if (A < 2 * Math.PI - 0.001) return null;
        const x3 = -R + 2 * R * holePct;
        const cx = (x3 - R) / 2.0;
        const rI = Math.abs(x3 + R) / 2.0;
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([cx + rI * Math.cos(ang), rI * Math.sin(ang)]);
        }
        return pts;
    }
    if (shapeType === "Circle" || shapeType === "Cog" || shapeType === "Pie Chart") {
        const rH = R * holePct;
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([rH * Math.cos(ang), rH * Math.sin(ang)]);
        }
        return pts;
    }

    const outer = getShapeVertices(shapeType, params, R);
    if (!outer.length) return null;

    if (shapeType === "Triangle") {
        const cx = (outer[0][0] + outer[1][0] + outer[2][0]) / 3.0;
        const cy = (outer[0][1] + outer[1][1] + outer[2][1]) / 3.0;
        return outer.map(([x, y]) => [cx + (x - cx) * holePct, cy + (y - cy) * holePct]);
    }

    return outer.map(([x, y]) => [x * holePct, y * holePct]);
}

function addRoundedPolygonSubpath(ctx, vertices, cornerPct, R) {
    const clean = [];
    for (const pt of vertices) {
        if (!clean.length || Math.hypot(pt[0] - clean[clean.length - 1][0], pt[1] - clean[clean.length - 1][1]) > 1e-4) {
            clean.push(pt);
        }
    }
    if (clean.length > 1 && Math.hypot(clean[0][0] - clean[clean.length - 1][0], clean[0][1] - clean[clean.length - 1][1]) < 1e-4) {
        clean.pop();
    }

    const n = clean.length;
    if (n === 0) return;
    if (cornerPct <= 0 || n < 3) {
        ctx.moveTo(clean[0][0], clean[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(clean[i][0], clean[i][1]);
        ctx.closePath();
        return;
    }

    const rMax = R * 0.4;
    const rVal = cornerPct * rMax;
    const APts = [];
    const BPts = [];

    for (let i = 0; i < n; i++) {
        const pCurr = clean[i];
        const pPrev = clean[(i - 1 + n) % n];
        const pNext = clean[(i + 1) % n];

        const v1x = pPrev[0] - pCurr[0], v1y = pPrev[1] - pCurr[1];
        const v2x = pNext[0] - pCurr[0], v2y = pNext[1] - pCurr[1];
        const d1 = Math.hypot(v1x, v1y), d2 = Math.hypot(v2x, v2y);

        const r = (d1 > 1e-4 && d2 > 1e-4) ? Math.min(rVal, d1 * 0.45, d2 * 0.45) : 0;
        if (r > 0.01) {
            APts.push([pCurr[0] + r * (v1x / d1), pCurr[1] + r * (v1y / d1)]);
            BPts.push([pCurr[0] + r * (v2x / d2), pCurr[1] + r * (v2y / d2)]);
        } else {
            APts.push(pCurr);
            BPts.push(pCurr);
        }
    }

    ctx.moveTo(BPts[n - 1][0], BPts[n - 1][1]);
    for (let i = 0; i < n; i++) {
        ctx.lineTo(APts[i][0], APts[i][1]);
        if (APts[i][0] !== BPts[i][0] || APts[i][1] !== BPts[i][1]) {
            ctx.quadraticCurveTo(clean[i][0], clean[i][1], BPts[i][0], BPts[i][1]);
        } else {
            ctx.lineTo(BPts[i][0], BPts[i][1]);
        }
    }
    ctx.closePath();
}

function addRoundedOpenSubpath(ctx, vertices, cornerPct, R) {
    const clean = [];
    for (const pt of vertices) {
        if (!clean.length || Math.hypot(pt[0] - clean[clean.length - 1][0], pt[1] - clean[clean.length - 1][1]) > 1e-4) {
            clean.push(pt);
        }
    }
    const n = clean.length;
    if (n === 0) return;
    if (cornerPct <= 0 || n < 3) {
        ctx.moveTo(clean[0][0], clean[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(clean[i][0], clean[i][1]);
        return;
    }

    const rMax = R * 0.4;
    const rVal = cornerPct * rMax;

    ctx.moveTo(clean[0][0], clean[0][1]);
    for (let i = 1; i < n - 1; i++) {
        const pPrev = clean[i - 1], pCurr = clean[i], pNext = clean[i + 1];
        const v1x = pPrev[0] - pCurr[0], v1y = pPrev[1] - pCurr[1];
        const v2x = pNext[0] - pCurr[0], v2y = pNext[1] - pCurr[1];
        const d1 = Math.hypot(v1x, v1y), d2 = Math.hypot(v2x, v2y);
        const r = (d1 > 1e-4 && d2 > 1e-4) ? Math.min(rVal, d1 * 0.45, d2 * 0.45) : 0;

        if (r > 0.01) {
            const ax = pCurr[0] + r * (v1x / d1), ay = pCurr[1] + r * (v1y / d1);
            const bx = pCurr[0] + r * (v2x / d2), by = pCurr[1] + r * (v2y / d2);
            ctx.lineTo(ax, ay);
            ctx.quadraticCurveTo(pCurr[0], pCurr[1], bx, by);
        } else {
            ctx.lineTo(pCurr[0], pCurr[1]);
        }
    }
    ctx.lineTo(clean[n - 1][0], clean[n - 1][1]);
}

function drawCanvasLine(ctx, pts, params, colorHex, thickness) {
    if (!pts || pts.length < 2) return;
    const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
    const showArrow = !!params["Show Arrow"];

    ctx.save();
    ctx.beginPath();
    if (cornerPct > 0 && pts.length >= 3) {
        addRoundedOpenSubpath(ctx, pts, cornerPct, 500);
    } else {
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    if (showArrow) {
        let idx = pts.length - 2;
        const pEnd = pts[pts.length - 1];
        let pPrev = pts[idx];
        let dx = pEnd[0] - pPrev[0], dy = pEnd[1] - pPrev[1];
        let dist = Math.hypot(dx, dy);

        while (dist < 10 && idx > 0) {
            idx--;
            pPrev = pts[idx];
            dx = pEnd[0] - pPrev[0];
            dy = pEnd[1] - pPrev[1];
            dist = Math.hypot(dx, dy);
        }

        const ux = dist > 0 ? dx / dist : 1;
        const uy = dist > 0 ? dy / dist : 0;
        const nx = -uy, ny = ux;

        const headScale = Math.max(15.0, thickness * 4.0);
        const hl = ((params["Head Length (%)"] ?? 40) / 100.0) * headScale * 2;
        const ht = 0.2 * headScale * 2;
        const hi = ((params["Head Inset (%)"] ?? 0) / 100.0) * headScale * 2;

        const left = [pEnd[0] - hl * ux + (ht / 2) * nx, pEnd[1] - hl * uy + (ht / 2) * ny];
        const right = [pEnd[0] - hl * ux - (ht / 2) * nx, pEnd[1] - hl * uy - (ht / 2) * ny];
        const inset = [pEnd[0] - (hl - hi) * ux, pEnd[1] - (hl - hi) * uy];

        ctx.beginPath();
        ctx.moveTo(pEnd[0], pEnd[1]);
        ctx.lineTo(left[0], left[1]);
        ctx.lineTo(inset[0], inset[1]);
        ctx.lineTo(right[0], right[1]);
        ctx.closePath();
        ctx.fillStyle = colorHex;
        ctx.fill();
    }
    ctx.restore();
}

function traceShapePathOnContext(ctx, shapeType, params, R) {
    ctx.beginPath();
    if (R <= 0) return;

    if (shapeType === "Line") {
        const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
        const showArrow = !!params["Show Arrow"];
        const vertices = [[-R * 0.8, R * 0.5], [-R * 0.2, -R * 0.5], [R * 0.4, R * 0.3], [R * 0.8, -R * 0.3]];
        addRoundedOpenSubpath(ctx, vertices, cornerPct, R);

        if (showArrow) {
            const [endX, endY] = vertices[3];
            const dx = endX - vertices[2][0], dy = endY - vertices[2][1];
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist, uy = dy / dist;
            const nx = -uy, ny = ux;
            const hl = ((params["Head Length (%)"] ?? 40) / 100.0) * R;
            const ht = 0.2 * R;
            const hi = ((params["Head Inset (%)"] ?? 0) / 100.0) * R;

            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - hl * ux + (ht / 2) * nx, endY - hl * uy + (ht / 2) * ny);
            ctx.lineTo(endX - (hl - hi) * ux, endY - (hl - hi) * uy);
            ctx.lineTo(endX - hl * ux - (ht / 2) * nx, endY - hl * uy - (ht / 2) * ny);
            ctx.closePath();
        }
        return;
    }

    const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
    const outerPts = getShapeVertices(shapeType, params, R);
    if (outerPts.length >= 3) {
        addRoundedPolygonSubpath(ctx, outerPts, cornerPct, R);
    }

    const holePts = getShapeHoleVertices(shapeType, params, R);
    if (holePts && holePts.length >= 3) {
        const holePct = Math.abs(params["Hole (%)"] ?? 0) / 100.0;
        addRoundedPolygonSubpath(ctx, holePts, cornerPct * holePct, R * holePct);
    }
}

function drawEmojiOnContext(ctx, emojiChar, fontSize, isGrayscale) {
    ctx.save();
    if (isGrayscale) {
        ctx.filter = "grayscale(100%)";
    }
    ctx.font = `${Math.round(fontSize)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojiChar || "🙂", 0, 0);
    ctx.restore();
}

function hexToRgba(hex, alpha = 1.0) {
    const clean = (hex || "#0096fa").replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbArray(hex) {
    const clean = (hex || "#0096fa").replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// ======================================================================
// TRIANGLE PREVIEW ANGLES & SIDE LENGTHS (Ported from Paint_Shape.py)
// ======================================================================
function drawTrianglePreviewMetrics(ctx, params, R) {
    const localPts = getShapeVertices("Triangle", params, R);
    if (!localPts || localPts.length < 3) return;

    const sortedByY = [...localPts].sort((a, b) => b[1] - a[1]);
    const bottomA = sortedByY[0], bottomB = sortedByY[1], v1 = sortedByY[2];
    const [v3, v2] = bottomA[0] < bottomB[0] ? [bottomA, bottomB] : [bottomB, bottomA];

    const baseLenPx = Math.hypot(v2[0] - v3[0], v2[1] - v3[1]);
    if (baseLenPx <= 0) return;

    const scale = 1.0 / baseLenPx;
    const lenBase = 1.0;
    const lenLeft = Math.hypot(v1[0] - v3[0], v1[1] - v3[1]) * scale;
    const lenRight = Math.hypot(v2[0] - v1[0], v2[1] - v1[1]) * scale;

    const calcAngleInfo = (pPrev, pCurr, pNext) => {
        const va = [pPrev[0] - pCurr[0], pPrev[1] - pCurr[1]];
        const vb = [pNext[0] - pCurr[0], pNext[1] - pCurr[1]];
        const magA = Math.hypot(va[0], va[1]);
        const magB = Math.hypot(vb[0], vb[1]);
        if (magA === 0 || magB === 0) return [0, 0, 0, 0];
        const dot = va[0] * vb[0] + va[1] * vb[1];
        const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
        const angleDeg = (Math.acos(cosAngle) * 180) / Math.PI;
        const a1 = Math.atan2(va[1], va[0]);
        const a2 = Math.atan2(vb[1], vb[0]);
        let diff = (a2 - a1) % (2 * Math.PI);
        if (diff < 0) diff += 2 * Math.PI;
        let sweep = diff > Math.PI ? -(2 * Math.PI - diff) : diff;
        return [angleDeg, a1, sweep, Math.min(magA, magB)];
    };

    const [ang1, st1, sw1, r1] = calcAngleInfo(v3, v1, v2);
    const [ang2, st2, sw2, r2] = calcAngleInfo(v1, v2, v3);
    const [ang3, st3, sw3, r3] = calcAngleInfo(v2, v3, v1);

    ctx.save();
    ctx.strokeStyle = "rgb(217, 119, 6)";
    ctx.lineWidth = 1.8;
    [[v1, st1, sw1, Math.min(r1 * 0.25, 18)], [v2, st2, sw2, Math.min(r2 * 0.25, 18)], [v3, st3, sw3, Math.min(r3 * 0.25, 18)]].forEach(([v, st, sw, arcR]) => {
        if (arcR > 2) {
            ctx.beginPath();
            ctx.arc(v[0], v[1], arcR, st, st + sw, sw < 0);
            ctx.stroke();
        }
    });

    ctx.font = "bold 9.5px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    [[v1, ang1, st1 + sw1 / 2], [v2, ang2, st2 + sw2 / 2], [v3, ang3, st3 + sw3 / 2]].forEach(([v, deg, bisect]) => {
        const tx = v[0] + 18 * Math.cos(bisect);
        const ty = v[1] + 18 * Math.sin(bisect);
        ctx.fillText(`${deg.toFixed(1)}°`, tx, ty);
    });

    ctx.fillStyle = "#38bdf8";
    const edges = [
        [(v3[0] + v2[0]) / 2, (v3[1] + v2[1]) / 2 + 11, lenBase.toFixed(2)],
        [(v1[0] + v3[0]) / 2 - 12, (v1[1] + v3[1]) / 2, lenLeft.toFixed(2)],
        [(v1[0] + v2[0]) / 2 + 12, (v1[1] + v2[1]) / 2, lenRight.toFixed(2)]
    ];
    edges.forEach(([mx, my, txt]) => ctx.fillText(txt, mx, my));
    ctx.restore();
}

// ======================================================================
// RESIZABLE BOUNDING BOX (Ported from ResizableBox in Paint_Helper.py)
// ======================================================================
class PaintResizableBox {
    constructor(x, y, width, height, handleSize = 10, hitPadding = 10) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.handleSize = handleSize;
        this.hitPadding = hitPadding;

        this.activeHandle = null;
        this.dragStartMouse = [0, 0];
        this.dragStartRect = { x, y, width, height };
    }

    getHandles() {
        const hs = this.handleSize;
        const half = hs / 2;
        const rotDist = hs * 2.5;
        const { x, y, width: w, height: h } = this;
        const cx = x + w / 2;
        const cy = y + h / 2;

        return {
            nw:  { x: x - half, y: y - half, w: hs, h: hs },
            ne:  { x: x + w - half, y: y - half, w: hs, h: hs },
            se:  { x: x + w - half, y: y + h - half, w: hs, h: hs },
            sw:  { x: x - half, y: y + h - half, w: hs, h: hs },
            n:   { x: cx - half, y: y - half, w: hs, h: hs },
            e:   { x: x + w - half, y: cy - half, w: hs, h: hs },
            s:   { x: cx - half, y: y + h - half, w: hs, h: hs },
            w:   { x: x - half, y: cy - half, w: hs, h: hs },
            c:   { x: cx - half, y: cy - half, w: hs, h: hs },
            rot: { x: cx - half, y: y - rotDist - half, w: hs, h: hs }
        };
    }

    hitTestHandle(px, py) {
        const pad = this.hitPadding;
        let closest = null;
        let minDist = Infinity;

        for (const [id, r] of Object.entries(this.getHandles())) {
            if (px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad) {
                const cx = r.x + r.w / 2;
                const cy = r.y + r.h / 2;
                const d = Math.hypot(px - cx, py - cy);
                if (d < minDist) {
                    minDist = d;
                    closest = id;
                }
            }
        }
        return closest;
    }

    startDrag(handleId, mousePt) {
        this.activeHandle = handleId;
        this.dragStartMouse = mousePt;
        this.dragStartRect = { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    updateDrag(mousePt) {
        if (!this.activeHandle) return;
        const dx = mousePt[0] - this.dragStartMouse[0];
        const dy = mousePt[1] - this.dragStartMouse[1];
        const { x: ox, y: oy, width: ow, height: oh } = this.dragStartRect;
        const aspect = oh !== 0 ? ow / oh : 1.0;

        let nx = ox, ny = oy, nw = ow, nh = oh;

        if (this.activeHandle === "e") {
            nw = Math.max(10, ow + dx);
        } else if (this.activeHandle === "w") {
            nw = Math.max(10, ow - dx);
            nx = ox + (ow - nw);
        } else if (this.activeHandle === "s") {
            nh = Math.max(10, oh + dy);
        } else if (this.activeHandle === "n") {
            nh = Math.max(10, oh - dy);
            ny = oy + (oh - nh);
        } else if (this.activeHandle === "c") {
            nx = ox + dx;
            ny = oy + dy;
        } else if (["se", "sw", "ne", "nw"].includes(this.activeHandle)) {
            const proposedW = ["se", "ne"].includes(this.activeHandle) ? ow + dx : ow - dx;
            nw = Math.max(10, proposedW);
            nh = nw / aspect;
            if (this.activeHandle === "sw") nx = ox + (ow - nw);
            else if (this.activeHandle === "ne") ny = oy + (oh - nh);
            else if (this.activeHandle === "nw") {
                nx = ox + (ow - nw);
                ny = oy + (oh - nh);
            }
        }

        this.x = nx;
        this.y = ny;
        this.width = nw;
        this.height = nh;
    }

    stopDrag() {
        this.activeHandle = null;
    }

    draw(ctx, scale = 1.0) {
        ctx.save();
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = Math.max(1, 1.5 / scale);
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.setLineDash([]);

        const handles = this.getHandles();
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = Math.max(1, 1.2 / scale);

        for (const [id, r] of Object.entries(handles)) {
            if (id === "rot") {
                const cx = this.x + this.width / 2;
                ctx.beginPath();
                ctx.moveTo(cx, this.y);
                ctx.lineTo(cx, r.y + r.h / 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(r.x, r.y, r.w, r.h);
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }
        }
        ctx.restore();
    }
}

// ======================================================================
// SHARED RENDERER: COMPOSITES PAINT ACTIONS ONTO ANY SLIDE CANVAS
// ======================================================================
function drawSinglePaintAction(ctx, action) {
    if (!action) return;
    const color = action.color || "#0096fa";
    const fillAlpha = (action.fillOpacity ?? 47) / 100.0;
    const thickness = action.thickness ?? 2;
    const params = action.params || {};

    if (action.type === "line") {
        const pts = action.points || [];
        const showArrow = !!params["Show Arrow"];
        if (action.fill && !showArrow && pts.length >= 3) {
            ctx.save();
            ctx.beginPath();
            const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
            addRoundedPolygonSubpath(ctx, pts, cornerPct, 500);
            ctx.fillStyle = hexToRgba(color, fillAlpha);
            ctx.fill("evenodd");
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.stroke();
            ctx.restore();
        } else {
            drawCanvasLine(ctx, pts, params, color, thickness);
        }
    } else if (action.type === "shape") {
        const [cx, cy] = action.center || [0, 0];
        const R = action.radius || 50;
        const angle = action.angle || 0;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        if (action.shape === "Emoji") {
            const emojiChar = params["Emoji"] || "🙂";
            const isGray = !!params["Grayscale"];
            drawEmojiOnContext(ctx, emojiChar, Math.max(14, R * 1.4), isGray);
        } else {
            traceShapePathOnContext(ctx, action.shape, params, R);
            ctx.fillStyle = hexToRgba(color, fillAlpha);
            ctx.fill("evenodd");
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.lineJoin = "round";
            ctx.stroke();
        }
        ctx.restore();
    } else if (action.type === "polygon_shape") {
        ctx.save();
        ctx.beginPath();
        const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
        for (const polyData of (action.polygons || [])) {
            const [extPts, intPts] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0])
                ? polyData
                : [polyData, []];
            if (extPts && extPts.length >= 3) {
                addRoundedPolygonSubpath(ctx, extPts, cornerPct, 500);
            }
            if (intPts) {
                for (const ring of intPts) {
                    if (ring && ring.length >= 3) {
                        addRoundedPolygonSubpath(ctx, ring, cornerPct, 500);
                    }
                }
            }
        }
        ctx.fillStyle = hexToRgba(color, fillAlpha);
        ctx.fill("evenodd");
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
    } else if (action.type === "text") {
        if (action.isEditing) return;
        const textStr = action.text || "";
        if (!textStr.trim()) return;

        const [cx, cy] = action.center || [0, 0];
        const angle = action.angle || 0;
        const fontSize = Math.max(8, Math.round(action.fontSize || params["Text Size"] || 32));
        const fontFace = action.fontFace || "Inter";
        const isBold = !!(action.bold ?? params["Bold"]);
        const isItalic = !!(action.italic ?? params["Italic"]);
        const hasOutline = !!(action.outline ?? params["Text Outline"]);
        const hasBgPill = !!(action.bgPill ?? params["Background Pill"]);
        const bgOpacity = (action.bgOpacity ?? params["Bg Opacity (%)"] ?? 65) / 100.0;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px "${fontFace}", sans-serif`;

        const lines = textStr.split("\n");
        const lineHeight = fontSize * 1.22;
        let maxW = 20;
        lines.forEach((l) => {
            const m = ctx.measureText(l || " ");
            if (m.width > maxW) maxW = m.width;
        });
        const totalH = lines.length * lineHeight;
        const padX = 12, padY = 8;

        if (hasBgPill) {
            const [r, g, b] = hexToRgbArray(color);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            ctx.fillStyle = lum < 128 ? `rgba(248, 250, 252, ${bgOpacity})` : `rgba(15, 23, 42, ${bgOpacity})`;
            ctx.beginPath();
            ctx.roundRect(-maxW / 2 - padX, -totalH / 2 - padY, maxW + padX * 2, totalH + padY * 2, 8);
            ctx.fill();
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const startY = -totalH / 2;

        lines.forEach((line, i) => {
            const ly = startY + i * lineHeight;
            if (hasOutline) {
                const [r, g, b] = hexToRgbArray(color);
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                ctx.strokeStyle = lum < 128 ? "#ffffff" : "#000000";
                ctx.lineWidth = Math.max(2, fontSize * 0.1);
                ctx.lineJoin = "round";
                ctx.strokeText(line, 0, ly);
            }
            ctx.fillStyle = color;
            ctx.fillText(line, 0, ly);
        });

        ctx.restore();
    }
}

function computeFloodFillLayer(baseCanvas, actions, fillIdx) {
    const fillAction = actions[fillIdx];
    const w = baseCanvas.width;
    const h = baseCanvas.height;
    if (w <= 0 || h <= 0) return null;

    // 1. Render background + all preceding actions onto a 1:1 work canvas
    const workCvs = document.createElement("canvas");
    workCvs.width = w;
    workCvs.height = h;
    const wCtx = workCvs.getContext("2d");
    wCtx.drawImage(baseCanvas, 0, 0);

    let startIndex = 0;
    for (let i = fillIdx - 1; i >= 0; i--) {
        if (actions[i].type === "clear") {
            startIndex = i + 1;
            break;
        }
    }

    for (let i = startIndex; i < fillIdx; i++) {
        const act = actions[i];
        if (act.type === "fill") {
            if (!act.cachedCanvas) act.cachedCanvas = computeFloodFillLayer(baseCanvas, actions, i);
            if (act.cachedCanvas) wCtx.drawImage(act.cachedCanvas, 0, 0);
        } else {
            drawSinglePaintAction(wCtx, act);
        }
    }

    const sx = Math.round(fillAction.pos[0]);
    const sy = Math.round(fillAction.pos[1]);
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return null;

    const srcData = wCtx.getImageData(0, 0, w, h).data;
    const startOffset = (sy * w + sx) * 4;
    const sr = srcData[startOffset];
    const sg = srcData[startOffset + 1];
    const sb = srcData[startOffset + 2];

    const tolerance = fillAction.params?.["Fill Tolerance"] ?? 18;
    const diff = Math.round((tolerance / 100.0) * 255);

    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0, tail = 0;

    const startIdx = sy * w + sx;
    visited[startIdx] = 1;
    queue[tail++] = startIdx;

    while (head < tail) {
        const curr = queue[head++];
        const cx = curr % w;
        const cy = (curr - cx) / w;

        // 4-connected neighbors
        if (cx > 0) {
            const n = curr - 1;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
        if (cx < w - 1) {
            const n = curr + 1;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
        if (cy > 0) {
            const n = curr - w;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
        if (cy < h - 1) {
            const n = curr + w;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
    }

    const outCvs = document.createElement("canvas");
    outCvs.width = w;
    outCvs.height = h;
    const outCtx = outCvs.getContext("2d");
    const outImg = outCtx.createImageData(w, h);
    const outData = outImg.data;

    const [fr, fg, fb] = hexToRgbArray(fillAction.color || "#0096fa");
    const fillType = fillAction.params?.["Fill Type"] || "Solid Color";

    for (let i = 0; i < tail; i++) {
        const idx = queue[i];
        const x = idx % w;
        const y = (idx - x) / w;
        const p = idx * 4;

        if (fillType === "Solid Color") {
            outData[p] = fr;
            outData[p + 1] = fg;
            outData[p + 2] = fb;
            outData[p + 3] = 255;
        } else if (fillType === "Transparent") {
            outData[p] = Math.round(srcData[p] * 0.5 + fr * 0.5);
            outData[p + 1] = Math.round(srcData[p + 1] * 0.5 + fg * 0.5);
            outData[p + 2] = Math.round(srcData[p + 2] * 0.5 + fb * 0.5);
            outData[p + 3] = 255;
        } else {
            let isFg = false;
            if (fillType === "Checkerboard") {
                isFg = (Math.floor(x / 10) + Math.floor(y / 10)) % 2 === 0;
            } else if (fillType === "Diagonal Stripes") {
                isFg = (x + y) % 15 < 7;
            } else if (fillType === "Polka Dots") {
                const cxP = (x % 20) - 10;
                const cyP = (y % 20) - 10;
                isFg = (cxP * cxP + cyP * cyP) <= 36;
            }
            outData[p] = isFg ? fr : 255;
            outData[p + 1] = isFg ? fg : 255;
            outData[p + 2] = isFg ? fb : 255;
            outData[p + 3] = 255;
        }
    }

    outCtx.putImageData(outImg, 0, 0);
    return outCvs;
}

function renderPaintActionsToCanvas(sourceEl, mediaItem) {
    if (!sourceEl) return null;
    const actions = mediaItem?.paintActions;
    if (!actions || !actions.length) return sourceEl;

    const w = sourceEl.naturalWidth || sourceEl.videoWidth || sourceEl.width || mediaItem.w || 1920;
    const h = sourceEl.naturalHeight || sourceEl.videoHeight || sourceEl.height || mediaItem.h || 1080;

    const cvs = document.createElement("canvas");
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext("2d");
    ctx.drawImage(sourceEl, 0, 0, w, h);

    let startIndex = 0;
    for (let i = actions.length - 1; i >= 0; i--) {
        if (actions[i].type === "clear") {
            startIndex = i + 1;
            break;
        }
    }

    for (let i = startIndex; i < actions.length; i++) {
        const act = actions[i];
        if (act.type === "fill") {
            if (!act.cachedCanvas) {
                act.cachedCanvas = computeFloodFillLayer(cvs, actions, i);
            }
            if (act.cachedCanvas) {
                ctx.drawImage(act.cachedCanvas, 0, 0, w, h);
            }
        } else {
            drawSinglePaintAction(ctx, act);
        }
    }

    return cvs;
}

window.renderPaintActionsToCanvas = renderPaintActionsToCanvas;

// ======================================================================
// MAIN PHOTO PAINT EDITOR CLASS
// ======================================================================
class PhotoPaintEditor {
    constructor(app) {
        this.app = app;
        this.SHAPE_PARAMS = getPaintShapeParamsConfig();

        this.maintype = "Shapes"; // "Shapes", "Text", "Select"
        this.currentShape = "Line";
        this.lastSelectedShape = {
            "Shapes": "Line",
            "Text": "FontModern",
            "Select": "Select"
        };

        this.color = "#0096fa";
        this.thickness = 2;
        this.fillOpacity = 47; // ~120/255 alpha matching Python
        this.polarRotation = false;
        this.polyMode = "normal"; // "normal", "union", "disjoint", "intersect", "symmetric", "erase", "subtract"

        // Saved Parameters per tool
        this.savedParams = {};
        this.initSavedParams();

        // Viewport Transform State
        this.zoomFactor = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanMouse = [0, 0];

        // Canvas Interaction & Selection State
        this.selectedActionIdx = null;
        this.vertexEditMode = false;
        this.draggingVertexInfo = null;
        this.resizableBox = null;
        this.isResizingShape = false;
        this.isRotatingShape = false;
        this.origActionCopy = null;

        this.isDrawing = false;
        this.hasDragged = false;
        this.dragStartScreen = [0, 0];
        this.dragStartWorld = [0, 0];
        this.strokePoints = [];
        this.lastStrokePos = null;
        this.currentMouseWorld = [0, 0];
        this.isHoveringCanvas = false;

        // Cached Background Image Canvas for current slide
        this.bgCanvas = null;
        this.origW = 1920;
        this.origH = 1080;

        // Active Floating Rich Text Editor
        this.activeTextIdx = null;

        this.initDOM();
        this.buildSidebarUI();
        this.bindCanvasEvents();
    }

    get item() {
        const primaryIdx = this.app.selectedIndices[this.app.selectedIndices.length - 1];
        return this.app.mediaItems[primaryIdx] || null;
    }

    get actions() {
        const itm = this.item;
        if (!itm) return [];
        if (!itm.paintActions) itm.paintActions = [];
        return itm.paintActions;
    }

    get undoneActions() {
        const itm = this.item;
        if (!itm) return [];
        if (!itm.paintUndoneActions) itm.paintUndoneActions = [];
        return itm.paintUndoneActions;
    }

    initSavedParams() {
        for (const [shapeName, params] of Object.entries(this.SHAPE_PARAMS)) {
            this.savedParams[shapeName] = {};
            for (const p of params) {
                if (p.length === 3) {
                    if ((p[1] === "choice" || p[1] === "font") && Array.isArray(p[2])) {
                        this.savedParams[shapeName][p[0]] = p[2][0];
                    } else {
                        this.savedParams[shapeName][p[0]] = p[2];
                    }
                } else {
                    this.savedParams[shapeName][p[0]] = p[3];
                }
            }
        }
    }

    initDOM() {
        this.stage = document.getElementById("paintStage");
        this.sidebarEl = document.getElementById("paintSidebar");
        this.canvasWrap = document.getElementById("paintCanvasWrap");
        this.canvas = document.getElementById("paintMainCanvas");
        this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
        this.floatingTextWrap = document.getElementById("paintFloatingTextWrap");
        this.floatingTextarea = document.getElementById("paintFloatingTextarea");
        this.emojiModal = document.getElementById("paintEmojiModal");
    }

    // ==================================================================
    // SIDEBAR UI CONSTRUCTION
    // ==================================================================
    buildSidebarUI() {
        if (!this.sidebarEl) return;
        this.sidebarEl.innerHTML = "";

        // 1. Top Mode Switcher Buttons: Shapes, Text, Select + Zoom Controls
        const modeRow = document.createElement("div");
        modeRow.className = "flex items-center gap-1 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shrink-0";
        this.modeButtons = {};

        [
            { id: "Shapes", icon: "📐", label: "Shapes" },
            { id: "Text",   icon: "🔤", label: "Text" },
            { id: "Select", icon: "↗️", label: "Select" }
        ].forEach((m) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.innerHTML = `<span class="text-[13px]">${m.icon}</span> <span class="hidden sm:inline">${m.label}</span>`;
            btn.className = "flex-1 px-1.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition min-w-0";
            btn.addEventListener("click", () => this.setMainMode(m.id));
            this.modeButtons[m.id] = btn;
            modeRow.appendChild(btn);
        });

        const divider = document.createElement("div");
        divider.className = "w-px h-6 bg-slate-700 mx-0.5 shrink-0";
        modeRow.appendChild(divider);

        const btnZoomFit = document.createElement("button");
        btnZoomFit.type = "button";
        btnZoomFit.id = "btnPaintZoomFit";
        btnZoomFit.innerHTML = "🌐";
        btnZoomFit.title = "Zoom to Fit";
        btnZoomFit.className = "p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition shrink-0 flex items-center justify-center";
        modeRow.appendChild(btnZoomFit);

        const btnZoom1to1 = document.createElement("button");
        btnZoom1to1.type = "button";
        btnZoom1to1.id = "btnPaintZoom1to1";
        btnZoom1to1.innerHTML = "🔍";
        btnZoom1to1.title = "Toggle 1:1 / 2:1 / 4:1 Zoom";
        btnZoom1to1.className = "p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition shrink-0 flex items-center justify-center";
        modeRow.appendChild(btnZoom1to1);

        this.sidebarEl.appendChild(modeRow);

        // 2. Section 1: Select Type Grid
        const typeBox = document.createElement("div");
        typeBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2 shrink-0";
        const typeTitle = document.createElement("div");
        typeTitle.className = "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1";
        typeTitle.textContent = "1. Select Type";
        typeBox.appendChild(typeTitle);

        this.typeGridContainer = document.createElement("div");
        typeBox.appendChild(this.typeGridContainer);
        this.sidebarEl.appendChild(typeBox);

       // 3. Section 2: Dynamic Parameters Box
        const paramsBox = document.createElement("div");
        paramsBox.id = "paintParamsBox"; // ADDED ID
        paramsBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex-1 min-h-[120px] overflow-y-auto filmstrip-scroll flex flex-col gap-2 transition-opacity";

        const paramsTitle = document.createElement("div");
        paramsTitle.className = "text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5 shrink-0";
        paramsTitle.textContent = "2. Parameters";
        paramsBox.appendChild(paramsTitle);

        this.paramsContentEl = document.createElement("div");
        this.paramsContentEl.className = "flex flex-col gap-2 flex-1";
        paramsBox.appendChild(this.paramsContentEl);
        this.sidebarEl.appendChild(paramsBox);

        // 4. Polygon Boolean Operations Bar (Visible for closed geometric shapes)
        this.polyOpsBox = document.createElement("div");
        this.polyOpsBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2 shrink-0 space-y-1.5";
        this.polyOpsBox.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-300 shrink-0">Polygon Op:</span>
                <select id="paintPolyOpSelect" class="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none">
                    <option value="union">Union (^U)</option>
                    <option value="disjoint">Disjoint (^D)</option>
                    <option value="intersect">Intersect (^I)</option>
                    <option value="symmetric">Symmetric (^S)</option>
                    <option value="erase">Erase (^E)</option>
                    <option value="subtract">Subtract</option>
                </select>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
                <button type="button" id="btnPaintPolyNormal" class="px-2 py-1 rounded text-xs font-bold bg-sky-500 text-slate-950">Normal</button>
                <button type="button" id="btnPaintPolyAuto" class="px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">Union</button>
                <button type="button" id="btnPaintPolyApplyNow" class="px-2 py-1 rounded text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white" title="Apply operation immediately to selected/overlapping shapes">Apply Now</button>
            </div>
        `;
        this.sidebarEl.appendChild(this.polyOpsBox);

        // 5. Preview & Global Style Box
        const previewBox = document.createElement("div");
        previewBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2 shrink-0 flex items-center gap-2.5";
        previewBox.innerHTML = `
            <div class="flex-1 flex flex-col gap-1.5 min-w-0">
                <div class="flex items-center justify-between gap-1.5">
                    <button type="button" id="btnPaintClear" class="flex-1 p-1.5 rounded bg-slate-800 hover:bg-red-900/60 border border-slate-700 text-xs flex items-center justify-center" title="Clear All Paint on Slide">🗑️</button>
                    <button type="button" id="btnPaintUndo" class="flex-1 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs flex items-center justify-center" title="Undo (Ctrl+Z)">↩️</button>
                    <button type="button" id="btnPaintRedo" class="flex-1 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs flex items-center justify-center" title="Redo (Ctrl+Y)">↪️</button>
                </div>

                <div class="flex items-center justify-between gap-1 pt-0.5">
                    <span id="lblPaintColor" class="text-[11px] font-bold text-slate-300">Color:</span>
                    <input type="color" id="inpPaintColor" value="${this.color}" class="w-10 h-6 rounded cursor-pointer bg-transparent border border-slate-700">
                </div>

                <div id="rowPaintStrokeWidth" class="flex flex-col gap-0.5">
                    <div class="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Width:</span>
                        <span id="lblPaintWidthVal" class="text-amber-400 font-bold">${this.thickness}px</span>
                    </div>
                    <input type="range" id="sliderPaintWidth" min="1" max="25" value="${this.thickness}" class="w-full accent-blue-500 cursor-pointer h-1.5">
                </div>

                <div id="rowPaintFillOpacity" class="flex flex-col gap-0.5">
                    <div class="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Fill Alpha:</span>
                        <span id="lblPaintAlphaVal" class="text-amber-400 font-bold">${this.fillOpacity}%</span>
                    </div>
                    <input type="range" id="sliderPaintAlpha" min="0" max="100" value="${this.fillOpacity}" class="w-full accent-blue-500 cursor-pointer h-1.5">
                </div>

                <label id="rowPaintPolar" class="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-300 cursor-pointer pt-0.5 select-none">
                    <input type="checkbox" id="chkPaintPolar" class="rounded bg-slate-800 border-slate-700 text-blue-600">
                    <span>Polar Rotation</span>
                </label>
            </div>

            <div class="w-[156px] h-[156px] shrink-0 rounded-lg border border-slate-800 bg-[#1c1c20] overflow-hidden flex items-center justify-center shadow-inner relative">
                <canvas id="paintPreviewCanvas" width="156" height="156" class="block w-full h-full"></canvas>
            </div>
        `;
        this.sidebarEl.appendChild(previewBox);

        this.previewCanvas = document.getElementById("paintPreviewCanvas");
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext("2d") : null;

        this.bindSidebarControls();
        this.setMainMode("Shapes", true);
    }

    bindSidebarControls() {
        const polySelect = document.getElementById("paintPolyOpSelect");
        const btnNormal = document.getElementById("btnPaintPolyNormal");
        const btnAuto = document.getElementById("btnPaintPolyAuto");
        const btnApplyNow = document.getElementById("btnPaintPolyApplyNow");

        const updatePolyUI = () => {
            const opName = polySelect.value;
            const opTitle = opName.charAt(0).toUpperCase() + opName.slice(1);
            btnAuto.textContent = opTitle;
            if (this.polyMode === "normal") {
                btnNormal.className = "px-2 py-1 rounded text-xs font-bold bg-sky-300 text-slate-950 border border-sky-400";
                btnAuto.className = "px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700";
            } else {
                this.polyMode = opName;
                btnAuto.className = "px-2 py-1 rounded text-xs font-bold bg-sky-300 text-slate-950 border border-sky-400";
                btnNormal.className = "px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700";
            }
        };

        polySelect?.addEventListener("change", () => {
            if (this.polyMode !== "normal") this.polyMode = polySelect.value;
            updatePolyUI();
        });
        btnNormal?.addEventListener("click", () => {
            this.polyMode = "normal";
            updatePolyUI();
        });
        btnAuto?.addEventListener("click", () => {
            this.polyMode = polySelect.value;
            updatePolyUI();
            ensurePolyBoolLoaded();
        });
        btnApplyNow?.addEventListener("click", async () => {
            await ensurePolyBoolLoaded();
            this.performBooleanOperation(polySelect.value, null);
        });

        document.getElementById("btnPaintClear")?.addEventListener("click", () => this.clearCanvas(true));
        document.getElementById("btnPaintUndo")?.addEventListener("click", () => this.undo());
        document.getElementById("btnPaintRedo")?.addEventListener("click", () => this.redo());
        document.getElementById("btnPaintZoomFit")?.addEventListener("click", () => this.zoomToFit());
        document.getElementById("btnPaintZoom1to1")?.addEventListener("click", () => this.zoomOneToOne());

        const colorInp = document.getElementById("inpPaintColor");
        colorInp?.addEventListener("input", () => {
            this.color = colorInp.value;
            if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]) {
                this.actions[this.selectedActionIdx].color = this.color;
                this.invalidateFillsAfter(this.selectedActionIdx);
                this.commitPaintChanges();
            }
            if (this.activeTextIdx !== null && this.actions[this.activeTextIdx]) {
                this.actions[this.activeTextIdx].color = this.color;
                if (this.floatingTextarea) this.floatingTextarea.style.color = this.color;
            }
            this.updateSampleTextPreview();
            this.renderPreviewPanel();
            this.redrawAll();
        });

        const widthSlider = document.getElementById("sliderPaintWidth");
        widthSlider?.addEventListener("input", () => {
            this.thickness = parseInt(widthSlider.value, 10);
            document.getElementById("lblPaintWidthVal").textContent = `${this.thickness}px`;
            if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]) {
                this.actions[this.selectedActionIdx].thickness = this.thickness;
                this.invalidateFillsAfter(this.selectedActionIdx);
                this.commitPaintChanges();
            }
            this.renderPreviewPanel();
            this.redrawAll();
        });

        const alphaSlider = document.getElementById("sliderPaintAlpha");
        alphaSlider?.addEventListener("input", () => {
            this.fillOpacity = parseInt(alphaSlider.value, 10);
            document.getElementById("lblPaintAlphaVal").textContent = `${this.fillOpacity}%`;
            if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]) {
                this.actions[this.selectedActionIdx].fillOpacity = this.fillOpacity;
                this.invalidateFillsAfter(this.selectedActionIdx);
                this.commitPaintChanges();
            }
            this.renderPreviewPanel();
            this.redrawAll();
        });

        const chkPolar = document.getElementById("chkPaintPolar");
        chkPolar?.addEventListener("change", () => {
            this.polarRotation = chkPolar.checked;
            this.renderPreviewPanel();
        });
    }

    setMainMode(mode, isInit = false) {
        this.commitActiveText();
        this.maintype = mode;

        Object.entries(this.modeButtons).forEach(([id, btn]) => {
            if (id === mode) {
                btn.className = "flex-1 px-1.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 bg-blue-600 text-white shadow min-w-0";
            } else {
                btn.className = "flex-1 px-1.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 min-w-0";
            }
        });

        this.rebuildTypeSelectorGrid();
        this.updateParametersUI();
        this.renderPreviewPanel();
        if (!isInit) this.redrawAll();
    }


    drawShapeIconOnCanvas(cvs, shapeName) {
        const ctx = cvs.getContext("2d");
        const w = cvs.width, h = cvs.height;
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        const R = Math.min(w, h) * 0.38;

        if (shapeName === "Emoji") {
            const em = this.savedParams["Emoji"]?.["Emoji"] || "🙂";
            drawEmojiOnContext(ctx, em, 18, false);
        } else if (shapeName === "Fill") {
            ctx.font = "17px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🪣", 0, 1);
        } else {
            traceShapePathOnContext(ctx, shapeName, {}, R);
            if (shapeName !== "Line") {
                ctx.fillStyle = "rgba(14, 165, 233, 0.45)";
                ctx.fill("evenodd");
            }
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.6;
            ctx.stroke();
        }
        ctx.restore();
    }

    rebuildTypeSelectorGrid() {
        if (!this.typeGridContainer) return;
        this.typeGridContainer.innerHTML = "";
        this.shapeButtons = {};

        if (this.maintype === "Shapes") {
            const grid = document.createElement("div");
            grid.className = "grid grid-cols-7 gap-1 justify-items-center";
            const shapeNames = Object.keys(this.SHAPE_PARAMS).filter(k => !k.startsWith("Font"));

            if (!shapeNames.includes(this.currentShape)) {
                this.currentShape = this.lastSelectedShape["Shapes"] || "Line";
            }

            shapeNames.forEach((sName) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.title = sName;
                btn.className = "w-[38px] h-[34px] rounded-lg border flex items-center justify-center transition p-0.5";

                const iconCvs = document.createElement("canvas");
                iconCvs.width = 32;
                iconCvs.height = 28;
                iconCvs.className = "block pointer-events-none";
                this.drawShapeIconOnCanvas(iconCvs, sName);
                btn.iconCanvas = iconCvs;
                btn.appendChild(iconCvs);

                btn.addEventListener("click", () => {
                    this.currentShape = sName;
                    this.lastSelectedShape["Shapes"] = sName;
                    this.highlightActiveTypeButton();
                    this.updateParametersUI();
                    this.renderPreviewPanel();
                });

                this.shapeButtons[sName] = btn;
                grid.appendChild(btn);
            });
            this.typeGridContainer.appendChild(grid);
        } else if (this.maintype === "Text") {
            const grid = document.createElement("div");
            grid.className = "grid grid-cols-5 gap-1";
            const fontShapes = Object.keys(this.SHAPE_PARAMS).filter(k => k.startsWith("Font"));

            if (!fontShapes.includes(this.currentShape)) {
                this.currentShape = this.lastSelectedShape["Text"] || "FontModern";
            }

            fontShapes.forEach((fName) => {
                const label = fName.replace("Font", "");
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = label;
                btn.className = "px-1.5 py-1.5 rounded-lg border text-[11px] font-bold transition truncate";
                btn.addEventListener("click", () => {
                    this.currentShape = fName;
                    this.lastSelectedShape["Text"] = fName;
                    this.highlightActiveTypeButton();
                    this.updateParametersUI();
                    this.syncActiveTextWithParams();
                });
                this.shapeButtons[fName] = btn;
                grid.appendChild(btn);
            });
            this.typeGridContainer.appendChild(grid);
        } else if (this.maintype === "Select") {
            this.currentShape = "Select";
            const info = document.createElement("div");
            info.className = "text-xs text-slate-300 px-1 py-1 leading-relaxed";
            info.innerHTML = `Click any shape or text on the canvas to move, resize, or rotate it. <b>Double-click</b> a shape to drag or delete individual vertices.`;
            this.typeGridContainer.appendChild(info);
        }

        this.highlightActiveTypeButton();
    }

    highlightActiveTypeButton() {
        Object.entries(this.shapeButtons || {}).forEach(([name, btn]) => {
            if (name === this.currentShape) {
                btn.style.backgroundColor = "rgb(173, 216, 230)";
                btn.style.color = "#0f172a";
                btn.style.borderColor = "#38bdf8";
            } else {
                btn.style.backgroundColor = "#0f172a";
                btn.style.color = "#cbd5e1";
                btn.style.borderColor = "#334155";
            }
        });
    }

    updateParametersUI() {
        if (!this.paramsContentEl) return;
        this.paramsContentEl.innerHTML = "";
        this.samplePanelCanvas = null;

        const showPoly = (this.maintype === "Shapes" && !["Line", "Fill", "Emoji"].includes(this.currentShape));
        const showPolar = (this.maintype === "Shapes" && !["Line", "Fill", "Arrow"].includes(this.currentShape));
        const showWidth = (this.maintype === "Shapes" && !["Fill", "Emoji"].includes(this.currentShape));

        if (this.polyOpsBox) this.polyOpsBox.classList.toggle("hidden", !showPoly);
        document.getElementById("rowPaintPolar")?.classList.toggle("hidden", !showPolar);
        document.getElementById("rowPaintStrokeWidth")?.classList.toggle("hidden", !showWidth && this.maintype !== "Select");

        const paramsBox = document.getElementById("paintParamsBox");
        if (this.maintype === "Select") {
            if (paramsBox) paramsBox.classList.add("hidden");
            this.buildSelectModePanel();
            return;
        } else {
            if (paramsBox) paramsBox.classList.remove("hidden");
        }

        const params = this.SHAPE_PARAMS[this.currentShape] || [];
        const curDict = this.savedParams[this.currentShape] || {};

        let skipNext = false;
        for (let i = 0; i < params.length; i++) {
            if (skipNext) {
                skipNext = false;
                continue;
            }
            const param = params[i];
            const label = param[0];

            if (this.currentShape === "Line" && (label === "Head Length (%)" || label === "Head Inset (%)")) {
                if (!curDict["Show Arrow"]) continue;
            }

            // Combine Bold & Italic on one row
            if (label === "Bold" && i + 1 < params.length && params[i + 1][0] === "Italic") {
                skipNext = true;
                const row = document.createElement("div");
                row.className = "flex items-center justify-between gap-2";
                row.innerHTML = `<span class="text-xs font-semibold text-slate-300">Style:</span>`;

                const btnWrap = document.createElement("div");
                btnWrap.className = "flex gap-1.5";

                ["Bold", "Italic"].forEach((styleKey) => {
                    const b = document.createElement("button");
                    b.type = "button";
                    b.textContent = styleKey;
                    const active = !!curDict[styleKey];
                    b.className = `px-3 py-1 rounded text-xs border transition ${styleKey === "Bold" ? "font-bold" : "italic"} ${
                        active ? "bg-sky-300 text-slate-950 border-sky-400" : "bg-slate-800 text-slate-300 border-slate-700"
                    }`;
                    b.addEventListener("click", () => {
                        curDict[styleKey] = !curDict[styleKey];
                        this.updateParametersUI();
                        this.syncActiveTextWithParams();
                    });
                    btnWrap.appendChild(b);
                });

                row.appendChild(btnWrap);
                this.paramsContentEl.appendChild(row);
            } else if (param.length === 3 && param[1] === "bool") {
                const row = document.createElement("label");
                row.className = "flex items-center justify-between gap-2 text-xs font-semibold text-slate-300 cursor-pointer py-0.5";
                const chk = document.createElement("input");
                chk.type = "checkbox";
                chk.checked = !!curDict[label];
                chk.className = "rounded bg-slate-800 border-slate-700 text-blue-600";
                chk.addEventListener("change", () => {
                    curDict[label] = chk.checked;
                    if (this.currentShape === "Triangle" && label === "Allow Obtuse") {
                        this.updateParametersUI();
                    }
                    this.syncActiveTextWithParams();
                    this.renderPreviewPanel();
                });
                row.innerHTML = `<span>${label}</span>`;
                row.appendChild(chk);
                this.paramsContentEl.appendChild(row);
            } else if (param[1] === "toggle") {
                const btnLabel = param.length === 4 ? param[2] : label;
                const row = document.createElement("div");
                row.className = "flex items-center justify-between gap-2";
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = btnLabel;
                const active = !!curDict[label];
                btn.className = `px-3 py-1 rounded text-xs font-bold border transition ${
                    active ? "bg-sky-300 text-slate-950 border-sky-400" : "bg-slate-800 text-slate-300 border-slate-700"
                }`;
                btn.addEventListener("click", () => {
                    curDict[label] = !curDict[label];
                    this.updateParametersUI();
                    this.renderPreviewPanel();
                });
                row.innerHTML = `<span class="text-xs font-semibold text-slate-300">${label}:</span>`;
                row.appendChild(btn);
                this.paramsContentEl.appendChild(row);
            } else if (param.length === 3 && param[1] === "choice") {
                const choices = param[2];
                const row = document.createElement("div");
                row.className = "flex items-center justify-between gap-2";
                const sel = document.createElement("select");
                sel.className = "bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-semibold";
                choices.forEach((c) => {
                    const opt = document.createElement("option");
                    opt.value = c;
                    opt.textContent = c;
                    if (c === curDict[label]) opt.selected = true;
                    sel.appendChild(opt);
                });
                sel.addEventListener("change", () => {
                    curDict[label] = sel.value;
                    this.renderPreviewPanel();
                });
                row.innerHTML = `<span class="text-xs font-semibold text-slate-300">${label}:</span>`;
                row.appendChild(sel);
                this.paramsContentEl.appendChild(row);
            } else if (param.length === 3 && param[1] === "font") {
                const fontList = param[2];
                const currentFont = curDict[label] || fontList[0];
                const isBold = !!curDict["Bold"];
                const isItalic = !!curDict["Italic"];

                const listBox = document.createElement("div");
                listBox.className = "max-h-[100px] overflow-y-auto filmstrip-scroll border border-slate-800 rounded-lg bg-slate-900 divide-y divide-slate-800/60";

                fontList.forEach((fName) => {
                    const itemBtn = document.createElement("button");
                    itemBtn.type = "button";
                    itemBtn.textContent = fName;
                    itemBtn.style.fontFamily = `"${fName}", sans-serif`;
                    itemBtn.style.fontWeight = isBold ? "bold" : "normal";
                    itemBtn.style.fontStyle = isItalic ? "italic" : "normal";
                    const isSel = fName === currentFont;
                    itemBtn.className = `w-full text-left px-2.5 py-1 text-xs transition ${
                        isSel ? "bg-sky-300 text-slate-950 font-bold" : "text-slate-200 hover:bg-slate-800"
                    }`;
                    itemBtn.addEventListener("click", () => {
                        curDict[label] = fName;
                        this.updateParametersUI();
                        this.syncActiveTextWithParams();
                    });
                    listBox.appendChild(itemBtn);
                });
                this.paramsContentEl.appendChild(listBox);
            } else if (param.length === 3 && param[1] === "emoji_grid") {
                const currentEmoji = curDict[label] || "🙂";
                const quickList = ["🙂", "🥷", "🦊", "🍎", "🏀", "✈️", "🌎", "🎥", "📝", "💙", "◀️", "🏁"];
                if (!quickList.includes(currentEmoji)) quickList[0] = currentEmoji;

                const grid = document.createElement("div");
                grid.className = "grid grid-cols-6 gap-1 pt-1";
                quickList.forEach((em) => {
                    const eb = document.createElement("button");
                    eb.type = "button";
                    eb.textContent = em;
                    const active = em === currentEmoji;
                    eb.className = `h-8 rounded-lg border text-base flex items-center justify-center transition ${
                        active ? "bg-sky-300 border-sky-400 scale-105" : "bg-slate-900 border-slate-700 hover:bg-slate-800"
                    }`;
                    eb.addEventListener("click", () => {
                        this.selectEmoji(em);
                    });
                    grid.appendChild(eb);
                });
                this.paramsContentEl.appendChild(grid);
            } else if (param.length === 3 && param[1] === "button") {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = param[2];
                btn.className = "w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition mt-1";
                btn.addEventListener("click", () => this.openEmojiPickerModal());
                this.paramsContentEl.appendChild(btn);
            } else if (param.length === 4) {
                let [, minVal, maxVal] = param;
                let curVal = curDict[label] ?? param[3];

                if (this.currentShape === "Triangle" && label === "Top Shift (%)") {
                    const allowObtuse = !!curDict["Allow Obtuse"];
                    minVal = allowObtuse ? -200 : -50;
                    maxVal = allowObtuse ? 200 : 50;
                    curVal = Math.max(minVal, Math.min(maxVal, curVal));
                    curDict[label] = curVal;
                }

                const wrap = document.createElement("div");
                wrap.className = "flex flex-col gap-0.5";
                wrap.innerHTML = `
                    <div class="flex justify-between text-[11px] font-semibold text-slate-300">
                        <span>${label}</span>
                        <span class="val-readout text-amber-400 font-bold">${curVal}</span>
                    </div>
                `;
                const slider = document.createElement("input");
                slider.type = "range";
                slider.min = String(minVal);
                slider.max = String(maxVal);
                slider.value = String(curVal);
                slider.className = "w-full accent-blue-500 cursor-pointer h-1.5";
                const valSpan = wrap.querySelector(".val-readout");

                slider.addEventListener("input", () => {
                    const v = parseInt(slider.value, 10);
                    curDict[label] = v;
                    valSpan.textContent = String(v);
                    if (this.currentShape.startsWith("Font")) {
                        this.updateSampleTextPreview();
                        this.syncActiveTextWithParams();
                    }
                    this.renderPreviewPanel();
                });

                wrap.appendChild(slider);
                this.paramsContentEl.appendChild(wrap);
            }
        }

        // Add Auto-Contrasting Sample Text Panel when in Font mode
        if (this.currentShape.startsWith("Font")) {
            const sampleWrap = document.createElement("div");
            sampleWrap.className = "mt-1 border border-slate-700 rounded-lg overflow-hidden shrink-0";
            const sampleCvs = document.createElement("canvas");
            sampleCvs.width = 280;
            sampleCvs.height = 76;
            sampleCvs.className = "w-full h-[76px] block";
            sampleWrap.appendChild(sampleCvs);
            this.paramsContentEl.appendChild(sampleWrap);
            this.samplePanelCanvas = sampleCvs;
            this.updateSampleTextPreview();
        }
    }

    buildSelectModePanel() {
        const hasSel = this.selectedActionIdx !== null && this.actions[this.selectedActionIdx];
        const act = hasSel ? this.actions[this.selectedActionIdx] : null;

        const wrap = document.createElement("div");
        wrap.className = "flex flex-col gap-2";

        if (!act) {
            wrap.innerHTML = `<div class="text-xs text-slate-400 italic py-2 text-center">No object currently selected on canvas.</div>`;
        } else {
            const canVertexEdit = ["shape", "polygon_shape", "line"].includes(act.type) && act.shape !== "Emoji";
            wrap.innerHTML = `
                <div class="text-xs font-bold text-sky-400 px-1">Selected: ${act.shape || act.type.toUpperCase()}</div>
                ${canVertexEdit ? `
                <button type="button" id="btnSelectToggleVertex" class="w-full py-1.5 px-3 rounded-lg font-bold text-xs border transition ${
                    this.vertexEditMode
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }">
                    ${this.vertexEditMode ? "✓ Vertex Edit Mode Active" : "Edit Individual Vertices"}
                </button>` : ""}
                <div class="grid grid-cols-2 gap-1.5 pt-1">
                    <button type="button" id="btnSelectDuplicate" class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200">Duplicate</button>
                    <button type="button" id="btnSelectDelete" class="py-1.5 px-2 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-xs font-semibold text-red-100">Delete Object</button>
                </div>
            `;
        }

        this.paramsContentEl.appendChild(wrap);

        document.getElementById("btnSelectToggleVertex")?.addEventListener("click", () => {
            if (this.selectedActionIdx === null) return;
            if (!this.vertexEditMode) {
                this.convertShapeToEditable(this.selectedActionIdx);
                this.vertexEditMode = true;
            } else {
                this.vertexEditMode = false;
            }
            this.buildSelectModePanel();
            this.redrawAll();
        });

        document.getElementById("btnSelectDuplicate")?.addEventListener("click", () => {
            if (!act) return;
            const clone = JSON.parse(JSON.stringify(act));
            if (clone.center) clone.center = [clone.center[0] + 24, clone.center[1] + 24];
            if (clone.points) clone.points = clone.points.map(([x, y]) => [x + 24, y + 24]);
            if (clone.polygons) {
                clone.polygons = clone.polygons.map(([ext, ints]) => [
                    ext.map(([x, y]) => [x + 24, y + 24]),
                    (ints || []).map(r => r.map(([x, y]) => [x + 24, y + 24]))
                ]);
            }
            this.actions.push(clone);
            this.selectedActionIdx = this.actions.length - 1;
            this.commitPaintChanges();
            this.redrawAll();
        });

        document.getElementById("btnSelectDelete")?.addEventListener("click", () => {
            if (this.selectedActionIdx === null) return;
            const idx = this.selectedActionIdx;
            this.actions.splice(idx, 1);
            this.selectedActionIdx = null;
            this.vertexEditMode = false;
            this.invalidateFillsAfter(idx);
            this.commitPaintChanges();
            this.buildSelectModePanel();
            this.redrawAll();
        });
    }

    updateSampleTextPreview() {
        if (!this.samplePanelCanvas) return;
        const cvs = this.samplePanelCanvas;
        const ctx = cvs.getContext("2d");
        const w = cvs.width, h = cvs.height;

        const [r, g, b] = hexToRgbArray(this.color);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        ctx.fillStyle = lum < 128 ? "#ffffff" : "#000000";
        ctx.fillRect(0, 0, w, h);

        const params = this.savedParams[this.currentShape] || {};
        const catKey = this.currentShape.replace("Font", "");
        const fontFace = params[catKey] || "Inter";
        const isBold = !!params["Bold"];
        const isItalic = !!params["Italic"];
        const fontSize = Math.min(28, Math.max(10, params["Text Size"] || 18));

        ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px "${fontFace}", sans-serif`;
        ctx.fillStyle = this.color;
        ctx.textBaseline = "top";

        const lines = [
            "Sample: 0123456789",
            "abcdefghijklm NOPQRSTUVWXYZ",
            "@#&(){}[]<>_+-*/=$%?!"
        ];
        lines.forEach((line, i) => {
            ctx.fillText(line, 6, 4 + i * (fontSize + 4));
        });
    }

    // ==================================================================
    // 156x156 PREVIEW PANEL & 2x LOUPE MAGNIFIER
    // ==================================================================
    renderPreviewPanel() {
        if (!this.previewCtx || !this.previewCanvas) return;
        const ctx = this.previewCtx;
        const w = this.previewCanvas.width;
        const h = this.previewCanvas.height;

        ctx.fillStyle = "#1c1c20";
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;
        const R = Math.min(w, h) * 0.35;
        const params = this.savedParams[this.currentShape] || {};

        // 1. Live 2x Loupe Mode when hovering over the main canvas
        if (this.isHoveringCanvas && this.bgCanvas) {
            const [wx, wy] = this.currentMouseWorld;
            const zoom = 2.0;
            const cropW = w / zoom;
            const cropH = h / zoom;

            ctx.save();
            ctx.drawImage(
                this.bgCanvas,
                wx - cropW / 2, wy - cropH / 2, cropW, cropH,
                0, 0, w, h
            );

            // Overlay ghost outline of active shape inside the loupe
            if (this.maintype === "Shapes" && this.currentShape !== "Fill") {
                ctx.translate(cx, cy);
                if (this.currentShape === "Emoji") {
                    drawEmojiOnContext(ctx, params["Emoji"] || "🙂", Math.max(12, R * 1.2), !!params["Grayscale"]);
                } else {
                    traceShapePathOnContext(ctx, this.currentShape, params, R);
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = Math.max(1, this.thickness);
                    ctx.stroke();
                }
            }
            ctx.restore();

            // Loupe reticle box & ticks
            const boxSz = 42;
            const x1 = cx - boxSz / 2, y1 = cy - boxSz / 2;
            ctx.strokeStyle = "rgba(0,0,0,0.85)";
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, boxSz, boxSz);
            ctx.strokeStyle = "#00e6ff";
            ctx.lineWidth = 1.8;
            ctx.strokeRect(x1, y1, boxSz, boxSz);

            const halfTic = 5;
            ctx.beginPath();
            ctx.moveTo(cx, y1 - halfTic); ctx.lineTo(cx, y1 + halfTic);
            ctx.moveTo(cx, y1 + boxSz - halfTic); ctx.lineTo(cx, y1 + boxSz + halfTic);
            ctx.moveTo(x1 - halfTic, cy); ctx.lineTo(x1 + halfTic, cy);
            ctx.moveTo(x1 + boxSz - halfTic, cy); ctx.lineTo(x1 + boxSz + halfTic, cy);
            ctx.strokeStyle = "#ffe600";
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        // 2. Standard Shape Preview Mode
        ctx.save();
        ctx.translate(cx, cy);

        if (this.currentShape === "Emoji") {
            drawEmojiOnContext(ctx, params["Emoji"] || "🙂", Math.max(18, R * 1.35), !!params["Grayscale"]);
        } else if (this.currentShape === "Fill") {
            drawEmojiOnContext(ctx, "🪣", 42, false);
        } else if (this.currentShape.startsWith("Font")) {
            ctx.fillStyle = this.color;
            ctx.font = "bold 26px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Aa", 0, 0);
        } else if (this.maintype === "Shapes") {
            traceShapePathOnContext(ctx, this.currentShape, params, R);
            if (this.currentShape !== "Line") {
                ctx.fillStyle = hexToRgba(this.color, this.fillOpacity / 100.0);
                ctx.fill("evenodd");
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.thickness;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.stroke();

            if (this.currentShape === "Triangle") {
                drawTrianglePreviewMetrics(ctx, params, R);
            }
        }
        ctx.restore();
    }

    // ==================================================================
    // EMOJI & COUNTRY FLAG MODAL PICKER
    // ==================================================================
    selectEmoji(emojiChar) {
        if (!this.savedParams["Emoji"]) this.savedParams["Emoji"] = {};
        this.savedParams["Emoji"]["Emoji"] = emojiChar;
        const btn = this.shapeButtons?.["Emoji"];
        if (btn && btn.iconCanvas) {
            this.drawShapeIconOnCanvas(btn.iconCanvas, "Emoji");
        }
        this.updateParametersUI();
        this.renderPreviewPanel();
    }

    openEmojiPickerModal() {
        if (!this.emojiModal) return;
        this.emojiModal.classList.remove("hidden");

        const currentEmoji = this.savedParams["Emoji"]?.["Emoji"] || "🙂";
        this.modalSelectedEmoji = currentEmoji;

        const tabsContainer = document.getElementById("paintEmojiTabs");
        const contentContainer = document.getElementById("paintEmojiContent");
        const btnSet = document.getElementById("btnPaintEmojiSet");
        const btnCancel = document.getElementById("btnPaintEmojiCancel");
        const lblStatus = document.getElementById("lblPaintEmojiStatus");

        const updateSelectedUI = (em) => {
            this.modalSelectedEmoji = em;
            if (btnSet) btnSet.textContent = `Set Emoji (${em})`;
            if (lblStatus) lblStatus.textContent = `Selected: ${em}`;
        };
        updateSelectedUI(currentEmoji);

        const allTabs = [...Object.keys(PAINT_EMOJI_CATEGORIES), "🇺🇳"];
        let activeTab = allTabs[0];

        const renderTabContent = (tabKey) => {
            activeTab = tabKey;
            Array.from(tabsContainer.children).forEach((b) => {
                b.className = b.dataset.tab === tabKey
                    ? "px-3 py-1.5 rounded-lg text-lg bg-sky-300 text-slate-950 font-bold shadow"
                    : "px-3 py-1.5 rounded-lg text-lg bg-slate-800 hover:bg-slate-700 text-slate-200";
            });

            contentContainer.innerHTML = "";

            if (tabKey !== "🇺🇳") {
                const grid = document.createElement("div");
                grid.className = "grid grid-cols-12 sm:grid-cols-14 gap-1.5 p-2";
                (PAINT_EMOJI_CATEGORIES[tabKey] || []).forEach((em) => {
                    if (!em) return;
                    const b = document.createElement("button");
                    b.type = "button";
                    b.textContent = em;
                    const isSel = em === this.modalSelectedEmoji;
                    b.className = `h-10 rounded-lg border text-xl flex items-center justify-center transition ${
                        isSel ? "bg-sky-300 border-sky-400 scale-105" : "bg-slate-900 border-slate-800 hover:bg-slate-800"
                    }`;
                    b.addEventListener("click", () => {
                        updateSelectedUI(em);
                        renderTabContent(tabKey);
                    });
                    grid.appendChild(b);
                });
                contentContainer.appendChild(grid);
            } else {
                // Country Flags Picker with Group Filter & Population Controls
                const wrap = document.createElement("div");
                wrap.className = "flex gap-3 h-full p-2";

                const leftCtrl = document.createElement("div");
                leftCtrl.className = "w-48 shrink-0 bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 text-xs text-slate-300";
                leftCtrl.innerHTML = `
                    <div class="font-bold text-slate-400 uppercase text-[10px]">Select Region:</div>
                    <select id="selEmojiCountryGroup" class="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs font-semibold text-white">
                        <option value="All Flags">All Flags</option>
                        ${Object.keys(PAINT_COUNTRY_DATA).map(k => `<option value="${k}">${k}</option>`).join("")}
                    </select>
                    <div class="h-px bg-slate-800 my-1"></div>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="chkCountryName" checked class="rounded bg-slate-800 border-slate-700">
                        <span>Show Country Name</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="chkCountryPop" class="rounded bg-slate-800 border-slate-700">
                        <span>Show Population</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="chkCountrySortPop" class="rounded bg-slate-800 border-slate-700">
                        <span>Sort by Population</span>
                    </label>
                `;

                const rightGrid = document.createElement("div");
                rightGrid.className = "flex-1 overflow-y-auto filmstrip-scroll flex flex-wrap gap-2 content-start p-1";

                const populateFlags = () => {
                    rightGrid.innerHTML = "";
                    const grp = leftCtrl.querySelector("#selEmojiCountryGroup").value;
                    const showName = leftCtrl.querySelector("#chkCountryName").checked;
                    const showPop = leftCtrl.querySelector("#chkCountryPop").checked;
                    const sortPop = leftCtrl.querySelector("#chkCountrySortPop").checked;

                    const items = [];
                    if (grp === "All Flags") {
                        Object.values(PAINT_COUNTRY_DATA).forEach(dict => {
                            Object.entries(dict).forEach(([name, [pop, flag]]) => items.push({ name, pop, flag }));
                        });
                    } else {
                        Object.entries(PAINT_COUNTRY_DATA[grp] || {}).forEach(([name, [pop, flag]]) => items.push({ name, pop, flag }));
                    }

                    if (sortPop) items.sort((a, b) => b.pop - a.pop);
                    else items.sort((a, b) => a.name.localeCompare(b.name));

                    items.forEach(({ name, pop, flag }) => {
                        const btn = document.createElement("button");
                        btn.type = "button";
                        const isSel = flag === this.modalSelectedEmoji;
                        btn.className = `px-2.5 py-1.5 rounded-lg border flex items-center gap-2 transition ${
                            isSel ? "bg-sky-300 text-slate-950 border-sky-400 font-bold" : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                        }`;
                        btn.title = `${name} — Pop: ${pop.toLocaleString()}`;
                        btn.innerHTML = `
                            <span class="text-xl">${flag}</span>
                            ${(showName || showPop) ? `
                            <div class="text-left leading-tight">
                                ${showName ? `<div class="text-[11px] font-semibold">${name}</div>` : ""}
                                ${showPop ? `<div class="text-[9.5px] opacity-75">${pop.toLocaleString()}</div>` : ""}
                            </div>` : ""}
                        `;
                        btn.addEventListener("click", () => {
                            updateSelectedUI(flag);
                            populateFlags();
                        });
                        rightGrid.appendChild(btn);
                    });
                };

                leftCtrl.querySelectorAll("select, input").forEach(el => el.addEventListener("change", populateFlags));
                wrap.appendChild(leftCtrl);
                wrap.appendChild(rightGrid);
                contentContainer.appendChild(wrap);
                populateFlags();
            }
        };

        tabsContainer.innerHTML = "";
        allTabs.forEach((tKey) => {
            const tb = document.createElement("button");
            tb.type = "button";
            tb.dataset.tab = tKey;
            tb.textContent = tKey;
            tb.addEventListener("click", () => renderTabContent(tKey));
            tabsContainer.appendChild(tb);
        });

        renderTabContent(activeTab);

        btnSet.onclick = () => {
            this.selectEmoji(this.modalSelectedEmoji);
            this.emojiModal.classList.add("hidden");
        };
        btnCancel.onclick = () => {
            this.emojiModal.classList.add("hidden");
        };
    }

    // ==================================================================
    // COORDINATE TRANSFORMS & VIEWPORT CONTROLS
    // ==================================================================
    getTransformParams() {
        if (!this.canvas) return [1, 0, 0];
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        if (cw <= 0 || ch <= 0 || this.origW <= 0 || this.origH <= 0) return [1, 0, 0];

        const fitScale = Math.min(cw / this.origW, ch / this.origH) * 0.96;
        const scale = fitScale * this.zoomFactor;
        const ox = (cw - this.origW * scale) / 2 + this.panX;
        const oy = (ch - this.origH * scale) / 2 + this.panY;
        return [scale, ox, oy];
    }

    screenToWorld(sx, sy) {
        const [scale, ox, oy] = this.getTransformParams();
        if (scale === 0) return [sx, sy];
        return [(sx - ox) / scale, (sy - oy) / scale];
    }

    worldToScreen(wx, wy) {
        const [scale, ox, oy] = this.getTransformParams();
        return [ox + wx * scale, oy + wy * scale];
    }

    worldToLocal(wx, wy, cx, cy, angle) {
        const dx = wx - cx, dy = wy - cy;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        return [dx * cosA + dy * sinA, -dx * sinA + dy * cosA];
    }

    localToWorld(lx, ly, cx, cy, angle) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        return [cx + lx * cosA - ly * sinA, cy + lx * sinA + ly * cosA];
    }

    zoomToFit() {
        this.zoomFactor = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.redrawAll();
    }

    zoomOneToOne() {
        if (!this.canvas) return;
        const cw = this.canvas.width, ch = this.canvas.height;
        const fitScale = Math.min(cw / this.origW, ch / this.origH) * 0.96;
        if (fitScale <= 0) return;

        const curEffective = fitScale * this.zoomFactor;
        let targetScale = 1.0;
        if (Math.abs(curEffective - 1.0) < 0.05) targetScale = 2.0;
        else if (Math.abs(curEffective - 2.0) < 0.05) targetScale = 4.0;

        this.zoomFactor = targetScale / fitScale;
        this.redrawAll();
    }

    clearCanvas(saveHistory = true) {
        this.commitActiveText();
        this.selectedActionIdx = null;
        this.vertexEditMode = false;
        if (saveHistory) {
            this.actions.push({ type: "clear" });
            this.undoneActions.length = 0;
        } else {
            this.actions.length = 0;
            this.undoneActions.length = 0;
        }
        this.commitPaintChanges();
        this.redrawAll();
    }

    undo() {
        this.commitActiveText();
        this.selectedActionIdx = null;
        this.vertexEditMode = false;
        if (this.actions.length > 0) {
            const act = this.actions.pop();
            this.undoneActions.push(act);
            this.commitPaintChanges();
            this.redrawAll();
        }
    }

    redo() {
        this.commitActiveText();
        this.selectedActionIdx = null;
        this.vertexEditMode = false;
        if (this.undoneActions.length > 0) {
            const act = this.undoneActions.pop();
            this.actions.push(act);
            this.commitPaintChanges();
            this.redrawAll();
        }
    }

    invalidateFillsAfter(startIdx = 0) {
        if (startIdx === null || startIdx === undefined) return;
        for (let i = Math.max(0, startIdx); i < this.actions.length; i++) {
            if (this.actions[i].type === "fill") {
                delete this.actions[i].cachedCanvas;
            }
        }
    }

    commitPaintChanges() {
        const itm = this.item;
        if (!itm) return;
        itm.generateThumbnail();
        this.app.renderFilmstrip();
    }

    // ==================================================================
    // ACTION BOUNDS, VERTICES & HIT TESTING
    // ==================================================================
    getActionVertices(action) {
        if (!action || action.type === "fill") return [];
        if (action.type === "line") return action.points || [];
        if (action.type === "polygon_shape") {
            const verts = [];
            for (const polyData of (action.polygons || [])) {
                const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                verts.push(...ext);
                for (const r of (ints || [])) verts.push(...r);
            }
            return verts;
        }
        if (action.type === "shape") {
            const [cx, cy] = action.center || [0, 0];
            const R = action.radius || 50;
            const angle = action.angle || 0;
            if (action.shape === "Emoji") {
                return paintTransformPts([[-R, -R], [R, -R], [R, R], [-R, R]], cx, cy, angle);
            }
            const localPts = getShapeVertices(action.shape, action.params || {}, R);
            return localPts.length ? paintTransformPts(localPts, cx, cy, angle) : [[cx, cy]];
        }
        if (action.type === "text") {
            const [cx, cy] = action.center || [0, 0];
            const angle = action.angle || 0;
            const bounds = this.getActionLocalBounds(action);
            if (bounds) {
                const [, , lw, lh] = bounds;
                const hw = lw / 2, hh = lh / 2;
                return paintTransformPts([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], cx, cy, angle);
            }
        }
        return [];
    }

    getActionCenterAndAngle(action) {
        if (action.type === "shape" || action.type === "text") {
            return [action.center || [0, 0], action.angle || 0];
        }
        if (action.type === "fill") {
            return [action.pos || [0, 0], 0];
        }
        if (action.center && action.angle !== undefined) {
            return [action.center, action.angle];
        }
        const verts = this.getActionVertices(action);
        if (verts.length) {
            const xs = verts.map(v => v[0]);
            const ys = verts.map(v => v[1]);
            const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
            const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
            action.center = [cx, cy];
            action.angle = action.angle || 0;
            return [action.center, action.angle];
        }
        return [[0, 0], 0];
    }

    getActionLocalBounds(action) {
        if (!action || action.type === "fill") return null;
        if (action.type === "shape") {
            const R = action.radius || 50;
            let localPts = action.shape === "Emoji"
                ? [[-R, -R], [R, -R], [R, R], [-R, R]]
                : getShapeVertices(action.shape, action.params || {}, R);
            if (!localPts.length) localPts = [[-R, -R], [R, -R], [R, R], [-R, R]];
            const xs = localPts.map(p => p[0]);
            const ys = localPts.map(p => p[1]);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            return [minX, minY, maxX - minX, maxY - minY];
        }
        if (action.type === "text") {
            const fontSize = Math.max(8, Math.round(action.fontSize || action.params?.["Text Size"] || 32));
            const fontFace = action.fontFace || "Inter";
            const isBold = !!(action.bold ?? action.params?.["Bold"]);
            const isItalic = !!(action.italic ?? action.params?.["Italic"]);
            const lines = (action.text || "Text").split("\n");

            if (this.ctx) {
                this.ctx.save();
                this.ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px "${fontFace}", sans-serif`;
                let maxW = 30;
                lines.forEach(l => {
                    const m = this.ctx.measureText(l || " ");
                    if (m.width > maxW) maxW = m.width;
                });
                this.ctx.restore();
                const totalH = lines.length * fontSize * 1.22;
                const pad = 12;
                return [-maxW / 2 - pad, -totalH / 2 - pad, maxW + pad * 2, totalH + pad * 2];
            }
            return [-60, -25, 120, 50];
        }

        const [[cx, cy], angle] = this.getActionCenterAndAngle(action);
        const verts = this.getActionVertices(action);
        if (!verts.length) return [-10, -10, 20, 20];
        const localPts = verts.map(([vx, vy]) => this.worldToLocal(vx, vy, cx, cy, angle));
        const xs = localPts.map(p => p[0]);
        const ys = localPts.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        return [minX, minY, Math.max(4, maxX - minX), Math.max(4, maxY - minY)];
    }

    pointInPolygon(px, py, ring) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-10) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq > 0 ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    hitTestShape(wx, wy) {
        let startIndex = 0;
        for (let i = this.actions.length - 1; i >= 0; i--) {
            if (this.actions[i].type === "clear") {
                startIndex = i + 1;
                break;
            }
        }

        const [scale] = this.getTransformParams();
        const tol = 10.0 / Math.max(0.1, scale);

        for (let i = this.actions.length - 1; i >= startIndex; i--) {
            const act = this.actions[i];
            if (act.type === "fill") continue;

            if (act.type === "text" || (act.type === "shape" && act.shape === "Emoji")) {
                const [[cx, cy], angle] = this.getActionCenterAndAngle(act);
                const bounds = this.getActionLocalBounds(act);
                if (bounds) {
                    const [lx, ly] = this.worldToLocal(wx, wy, cx, cy, angle);
                    if (lx >= bounds[0] - tol && lx <= bounds[0] + bounds[2] + tol &&
                        ly >= bounds[1] - tol && ly <= bounds[1] + bounds[3] + tol) {
                        return i;
                    }
                }
                continue;
            }

            if (act.type === "line") {
                const pts = act.points || [];
                if (act.fill && pts.length >= 3 && this.pointInPolygon(wx, wy, pts)) return i;
                for (let j = 0; j < pts.length - 1; j++) {
                    if (this.distToSegment(wx, wy, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1]) <= tol + (act.thickness || 2) / 2) {
                        return i;
                    }
                }
                continue;
            }

            if (act.type === "shape") {
                const verts = this.getActionVertices(act);
                if (verts.length >= 3 && this.pointInPolygon(wx, wy, verts)) return i;
                for (let j = 0; j < verts.length; j++) {
                    const nxt = verts[(j + 1) % verts.length];
                    if (this.distToSegment(wx, wy, verts[j][0], verts[j][1], nxt[0], nxt[1]) <= tol) return i;
                }
            } else if (act.type === "polygon_shape") {
                for (const polyData of (act.polygons || [])) {
                    const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                    if (ext.length >= 3 && this.pointInPolygon(wx, wy, ext)) {
                        let inHole = false;
                        for (const hole of (ints || [])) {
                            if (this.pointInPolygon(wx, wy, hole)) {
                                inHole = true;
                                break;
                            }
                        }
                        if (!inHole) return i;
                    }
                    for (let j = 0; j < ext.length; j++) {
                        const nxt = ext[(j + 1) % ext.length];
                        if (this.distToSegment(wx, wy, ext[j][0], ext[j][1], nxt[0], nxt[1]) <= tol) return i;
                    }
                }
            }
        }
        return null;
    }

    hitTestVertex(action, wx, wy) {
        if (!action || action.type === "fill") return null;
        const [scale] = this.getTransformParams();
        const scaledTol = 14.0 / Math.max(0.1, scale);
        let closest = null;
        let minDist = Infinity;

        if (action.type === "line") {
            (action.points || []).forEach(([vx, vy], idx) => {
                const d = Math.hypot(wx - vx, wy - vy);
                if (d <= scaledTol && d < minDist) {
                    minDist = d;
                    closest = ["line", idx];
                }
            });
        } else if (action.type === "polygon_shape") {
            (action.polygons || []).forEach((polyData, pIdx) => {
                const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                ext.forEach(([vx, vy], vIdx) => {
                    const d = Math.hypot(wx - vx, wy - vy);
                    if (d <= scaledTol && d < minDist) {
                        minDist = d;
                        closest = ["poly_ext", pIdx, vIdx];
                    }
                });
                (ints || []).forEach((ring, rIdx) => {
                    ring.forEach(([vx, vy], vIdx) => {
                        const d = Math.hypot(wx - vx, wy - vy);
                        if (d <= scaledTol && d < minDist) {
                            minDist = d;
                            closest = ["poly_int", pIdx, rIdx, vIdx];
                        }
                    });
                });
            });
        }
        return closest;
    }

    convertShapeToEditable(idx) {
        const act = this.actions[idx];
        if (!act || act.type === "polygon_shape" || act.type === "fill" || act.type === "text") return;
        if (act.type === "shape" && act.shape !== "Emoji") {
            const [[cx, cy], angle] = this.getActionCenterAndAngle(act);
            const outerLocal = getShapeVertices(act.shape, act.params || {}, act.radius || 50);
            const outerWorld = paintTransformPts(outerLocal, cx, cy, angle);
            const holeLocal = getShapeHoleVertices(act.shape, act.params || {}, act.radius || 50);
            const holesWorld = holeLocal ? [paintTransformPts(holeLocal, cx, cy, angle)] : [];

            if (outerWorld.length >= 3) {
                this.actions[idx] = {
                    type: "polygon_shape",
                    polygons: [[outerWorld, holesWorld]],
                    color: act.color,
                    fillOpacity: act.fillOpacity,
                    thickness: act.thickness,
                    params: { ...(act.params || {}) },
                    center: [cx, cy],
                    angle
                };
            }
        }
    }

    recalculateShapeCenter(action) {
        if (!action || !["line", "polygon_shape"].includes(action.type) || !action.center) return;
        const [cx, cy] = action.center;
        const angle = action.angle || 0;
        const verts = this.getActionVertices(action);
        if (!verts.length) return;

        const cosA = Math.cos(-angle), sinA = Math.sin(-angle);
        const lxs = [], lys = [];
        verts.forEach(([vx, vy]) => {
            const dx = vx - cx, dy = vy - cy;
            lxs.push(dx * cosA - dy * sinA);
            lys.push(dx * sinA + dy * cosA);
        });

        const lcx = (Math.min(...lxs) + Math.max(...lxs)) / 2;
        const lcy = (Math.min(...lys) + Math.max(...lys)) / 2;
        const cosF = Math.cos(angle), sinF = Math.sin(angle);
        action.center = [
            cx + lcx * cosF - lcy * sinF,
            cy + lcx * sinF + lcy * cosF
        ];
    }

    deleteVertexFromShape(action, vInfo) {
        const type = vInfo[0];
        if (type === "line") {
            const idx = vInfo[1];
            if (action.points.length > 2) action.points.splice(idx, 1);
        } else if (type === "poly_ext") {
            const [, pIdx, vIdx] = vInfo;
            const ext = action.polygons[pIdx][0];
            if (ext.length > 3) ext.splice(vIdx, 1);
        } else if (type === "poly_int") {
            const [, pIdx, rIdx, vIdx] = vInfo;
            const ring = action.polygons[pIdx][1][rIdx];
            if (ring.length > 3) ring.splice(vIdx, 1);
            else action.polygons[pIdx][1].splice(rIdx, 1);
        }
    }

    // ==================================================================
    // BOOLEAN POLYGON OPERATIONS (Powered by Lazy-Loaded PolyBoolJS)
    // ==================================================================
    actionToPolyBool(action) {
        if (!action) return null;
        if (action.type === "shape") {
            if (action.shape === "Emoji") return null;
            const [[cx, cy], angle] = this.getActionCenterAndAngle(action);
            const outerLocal = getShapeVertices(action.shape, action.params || {}, action.radius || 50);
            if (outerLocal.length < 3) return null;
            const regions = [paintTransformPts(outerLocal, cx, cy, angle)];
            const holeLocal = getShapeHoleVertices(action.shape, action.params || {}, action.radius || 50);
            if (holeLocal && holeLocal.length >= 3) {
                regions.push(paintTransformPts(holeLocal, cx, cy, angle));
            }
            return { regions, inverted: false };
        }
        if (action.type === "line") {
            if (!action.fill || !action.points || action.points.length < 3) return null;
            return { regions: [action.points.map(([x, y]) => [x, y])], inverted: false };
        }
        if (action.type === "polygon_shape") {
            const regions = [];
            for (const polyData of (action.polygons || [])) {
                const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                if (ext && ext.length >= 3) regions.push(ext.map(([x, y]) => [x, y]));
                for (const r of (ints || [])) {
                    if (r && r.length >= 3) regions.push(r.map(([x, y]) => [x, y]));
                }
            }
            return regions.length ? { regions, inverted: false } : null;
        }
        return null;
    }

    bboxesOverlap(polyA, polyB) {
        const getBounds = (pb) => {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            pb.regions.forEach(reg => reg.forEach(([x, y]) => {
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
            }));
            return { minX, minY, maxX, maxY };
        };
        const a = getBounds(polyA), b = getBounds(polyB);
        return !(b.minX > a.maxX || b.maxX < a.minX || b.minY > a.maxY || b.maxY < a.minY);
    }

    async performBooleanOperation(opType = "union", newAction = null) {
        if (opType === "normal") {
            if (newAction) this.actions.push(newAction);
            return;
        }

        if (newAction) {
            if (newAction.shape === "Emoji") {
                this.actions.push(newAction);
                return;
            }
            this.actions.push(newAction);
            this.selectedActionIdx = this.actions.length - 1;
        }

        const PolyBool = await ensurePolyBoolLoaded();
        if (!PolyBool) {
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        let startIndex = 0;
        for (let i = this.actions.length - 1; i >= 0; i--) {
            if (this.actions[i].type === "clear") {
                startIndex = i + 1;
                break;
            }
        }

        const validIndices = [];
        const polyMap = new Map();
        for (let i = startIndex; i < this.actions.length; i++) {
            const pb = this.actionToPolyBool(this.actions[i]);
            if (pb && pb.regions.length > 0) {
                validIndices.push(i);
                polyMap.set(i, pb);
            }
        }
        if (validIndices.length < 2) {
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        let targetIdx = this.selectedActionIdx;
        if (targetIdx === null || !polyMap.has(targetIdx)) {
            targetIdx = validIndices[validIndices.length - 1];
        }
        const targetAct = this.actions[targetIdx];
        const targetPoly = polyMap.get(targetIdx);

        // Find overlapping shapes
        const overlappingIndices = [];
        for (const idx of validIndices) {
            if (idx === targetIdx) continue;
            const otherPoly = polyMap.get(idx);
            if (!this.bboxesOverlap(targetPoly, otherPoly)) continue;
            try {
                const inter = PolyBool.intersect(targetPoly, otherPoly);
                if (inter && inter.regions && inter.regions.length > 0) {
                    overlappingIndices.push(idx);
                }
            } catch (_) {}
        }

        if (!overlappingIndices.length) {
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        try {
            let combinedSources = polyMap.get(overlappingIndices[0]);
            for (let i = 1; i < overlappingIndices.length; i++) {
                combinedSources = PolyBool.union(combinedSources, polyMap.get(overlappingIndices[i]));
            }

            let resultPoly = null;
            let indicesToRemove = [];

            if (opType === "union") {
                resultPoly = PolyBool.union(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "intersect") {
                resultPoly = PolyBool.intersect(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "symmetric") {
                resultPoly = PolyBool.xor(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "subtract") {
                resultPoly = PolyBool.difference(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "erase") {
                resultPoly = PolyBool.difference(combinedSources, targetPoly);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "disjoint") {
                resultPoly = PolyBool.difference(targetPoly, combinedSources);
                indicesToRemove = [targetIdx];
            }

            if (resultPoly && resultPoly.regions && resultPoly.regions.length > 0) {
                for (const remIdx of indicesToRemove) {
                    this.actions.splice(remIdx, 1);
                }
                const newShape = {
                    type: "polygon_shape",
                    polygons: resultPoly.regions.map(reg => [reg, []]),
                    color: targetAct.color || this.color,
                    fillOpacity: targetAct.fillOpacity ?? this.fillOpacity,
                    thickness: targetAct.thickness ?? this.thickness,
                    params: { ...(targetAct.params || {}) }
                };
                this.getActionCenterAndAngle(newShape);
                this.actions.push(newShape);
                this.selectedActionIdx = this.actions.length - 1;
                this.invalidateFillsAfter(0);
            } else if (opType === "disjoint" || opType === "erase") {
                for (const remIdx of indicesToRemove) {
                    this.actions.splice(remIdx, 1);
                }
                this.selectedActionIdx = null;
                this.invalidateFillsAfter(0);
            }
        } catch (err) {
            console.warn("Boolean operation error:", err);
        }

        this.commitPaintChanges();
        this.redrawAll();
    }

    // ==================================================================
    // INLINE FLOATING RICH TEXT EDITOR
    // ==================================================================
    openFloatingTextEditor(idx) {
        const act = this.actions[idx];
        if (!act || !this.floatingTextWrap || !this.floatingTextarea) return;

        this.activeTextIdx = idx;
        act.isEditing = true;

        const [sx, sy] = this.worldToScreen(act.center[0], act.center[1]);
        const [scale] = this.getTransformParams();
        const scaledFont = Math.max(12, Math.round((act.fontSize || 32) * scale));

        this.floatingTextWrap.classList.remove("hidden");
        this.floatingTextWrap.style.left = `${Math.round(sx - 90)}px`;
        this.floatingTextWrap.style.top = `${Math.round(sy - scaledFont / 2 - 8)}px`;

        this.floatingTextarea.value = act.text || "";
        this.floatingTextarea.style.fontFamily = `"${act.fontFace || "Inter"}", sans-serif`;
        this.floatingTextarea.style.fontSize = `${scaledFont}px`;
        this.floatingTextarea.style.fontWeight = act.bold ? "bold" : "normal";
        this.floatingTextarea.style.fontStyle = act.italic ? "italic" : "normal";
        this.floatingTextarea.style.color = act.color || this.color;

        this.autoResizeFloatingTextarea();
        setTimeout(() => {
            this.floatingTextarea.focus();
            this.floatingTextarea.select();
        }, 20);

        this.redrawAll();
    }

    autoResizeFloatingTextarea() {
        if (!this.floatingTextarea) return;
        this.floatingTextarea.style.height = "auto";
        this.floatingTextarea.style.width = "auto";
        const w = Math.max(160, Math.min(600, this.floatingTextarea.scrollWidth + 24));
        const h = Math.max(44, this.floatingTextarea.scrollHeight + 8);
        this.floatingTextarea.style.width = `${w}px`;
        this.floatingTextarea.style.height = `${h}px`;
    }

    syncActiveTextWithParams() {
        const targetIdx = this.activeTextIdx !== null ? this.activeTextIdx : this.selectedActionIdx;
        if (targetIdx === null || !this.actions[targetIdx] || this.actions[targetIdx].type !== "text") return;

        const act = this.actions[targetIdx];
        const params = this.savedParams[this.currentShape] || {};
        const catKey = this.currentShape.replace("Font", "");

        if (params[catKey]) act.fontFace = params[catKey];
        if (params["Text Size"] !== undefined) act.fontSize = params["Text Size"];
        if (params["Bold"] !== undefined) act.bold = !!params["Bold"];
        if (params["Italic"] !== undefined) act.italic = !!params["Italic"];
        if (params["Text Outline"] !== undefined) act.outline = !!params["Text Outline"];
        if (params["Background Pill"] !== undefined) act.bgPill = !!params["Background Pill"];
        if (params["Bg Opacity (%)"] !== undefined) act.bgOpacity = params["Bg Opacity (%)"];
        act.color = this.color;

        if (this.activeTextIdx !== null && this.floatingTextarea) {
            const [scale] = this.getTransformParams();
            this.floatingTextarea.style.fontFamily = `"${act.fontFace}", sans-serif`;
            this.floatingTextarea.style.fontSize = `${Math.max(12, Math.round(act.fontSize * scale))}px`;
            this.floatingTextarea.style.fontWeight = act.bold ? "bold" : "normal";
            this.floatingTextarea.style.fontStyle = act.italic ? "italic" : "normal";
            this.floatingTextarea.style.color = act.color;
            this.autoResizeFloatingTextarea();
        }

        this.commitPaintChanges();
        this.redrawAll();
    }

    commitActiveText() {
        if (this.activeTextIdx === null) return;
        const act = this.actions[this.activeTextIdx];
        if (act) {
            act.isEditing = false;
            act.text = this.floatingTextarea ? this.floatingTextarea.value : act.text;
            if (!act.text || !act.text.trim()) {
                this.actions.splice(this.activeTextIdx, 1);
            }
        }
        this.activeTextIdx = null;
        if (this.floatingTextWrap) this.floatingTextWrap.classList.add("hidden");
        this.commitPaintChanges();
        this.redrawAll();
    }

    // ==================================================================
    // CANVAS POINTER, WHEEL & KEYBOARD EVENTS
    // ==================================================================
    bindCanvasEvents() {
        if (!this.canvas) return;

        this.floatingTextarea?.addEventListener("input", () => this.autoResizeFloatingTextarea());
        this.floatingTextarea?.addEventListener("blur", () => this.commitActiveText());
        this.floatingTextarea?.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                this.commitActiveText();
            }
        });

        this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        window.addEventListener("pointermove", (e) => this.onPointerMove(e));
        window.addEventListener("pointerup", (e) => this.onPointerUp(e));
        this.canvas.addEventListener("dblclick", (e) => this.onDoubleClick(e));

        this.canvas.addEventListener("pointerenter", () => {
            this.isHoveringCanvas = true;
            this.renderPreviewPanel();
        });
        this.canvas.addEventListener("pointerleave", () => {
            this.isHoveringCanvas = false;
            this.renderPreviewPanel();
        });

        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            if (e.deltaY < 0) this.zoomFactor *= 1.15;
            else if (e.deltaY > 0) this.zoomFactor /= 1.15;
            this.zoomFactor = Math.max(0.1, Math.min(this.zoomFactor, 30.0));

            const rect = this.canvas.getBoundingClientRect();
            this.currentMouseWorld = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            this.redrawAll();
            this.renderPreviewPanel();
        }, { passive: false });
    }

    applyBoxResize() {
        if (this.selectedActionIdx === null || !this.origActionCopy || !this.resizableBox) return;
        const act = this.actions[this.selectedActionIdx];
        const origAct = this.origActionCopy;
        const origBounds = this.getActionLocalBounds(origAct);
        if (!origBounds) return;

        const [origLx, origLy, origLw, origLh] = origBounds;
        const safeLw = origLw || 0.001, safeLh = origLh || 0.001;
        const { x: newLx, y: newLy, width: newLw, height: newLh } = this.resizableBox;
        const scaleX = newLw / safeLw;
        const scaleY = newLh / safeLh;

        const [[cx, cy], angle] = this.getActionCenterAndAngle(origAct);
        const cosA = Math.cos(angle), sinA = Math.sin(angle);

        const transformLocalPt = ([px, py]) => {
            const dx = px - cx, dy = py - cy;
            const lx = dx * cosA + dy * sinA;
            const ly = -dx * sinA + dy * cosA;
            const slx = newLx + (lx - origLx) * scaleX;
            const sly = newLy + (ly - origLy) * scaleY;
            return [
                cx + slx * cosA - sly * sinA,
                cy + slx * sinA + sly * cosA
            ];
        };

        if (act.type === "line") {
            act.points = origAct.points.map(pt => transformLocalPt(pt));
            act.center = transformLocalPt([cx, cy]);
        } else if (act.type === "polygon_shape") {
            act.polygons = origAct.polygons.map(([ext, ints]) => [
                ext.map(pt => transformLocalPt(pt)),
                (ints || []).map(r => r.map(pt => transformLocalPt(pt)))
            ]);
            act.center = transformLocalPt([cx, cy]);
        } else if (act.type === "shape") {
            const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
            act.radius = (origAct.radius || 50) * avgScale;
            act.center = transformLocalPt([cx, cy]);
        } else if (act.type === "text") {
            const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
            act.fontSize = Math.max(8, (origAct.fontSize || 32) * avgScale);
            act.center = transformLocalPt([cx, cy]);
        }
    }

    onPointerDown(e) {
        if (!this.item) return;

        // Middle mouse button or Alt+LeftClick pans the canvas
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            this.isPanning = true;
            this.lastPanMouse = [e.clientX, e.clientY];
            this.canvas.setPointerCapture(e.pointerId);
            return;
        }

        if (e.button !== 0) return;
        if (this.activeTextIdx !== null) {
            this.commitActiveText();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [wx, wy] = this.screenToWorld(sx, sy);

        this.isDrawing = true;
        this.hasDragged = false;
        this.dragStartScreen = [sx, sy];
        this.dragStartWorld = [wx, wy];

        // 1. Check active ResizableBox handles first
        if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx] && !this.vertexEditMode) {
            const act = this.actions[this.selectedActionIdx];
            const [[cx, cy], angle] = this.getActionCenterAndAngle(act);
            const bounds = this.getActionLocalBounds(act);
            if (bounds) {
                const [scale] = this.getTransformParams();
                const hs = PAINT_HANDLE_SIZE / Math.max(0.001, scale);
                const pad = 10.0 / Math.max(0.001, scale);
                const box = new PaintResizableBox(bounds[0], bounds[1], bounds[2], bounds[3], hs, pad);
                const [lx, ly] = this.worldToLocal(wx, wy, cx, cy, angle);
                const handleId = box.hitTestHandle(lx, ly);

                if (handleId) {
                    if (handleId !== "rot" && !["se", "sw", "ne", "nw", "c"].includes(handleId) && act.type === "shape" && act.shape !== "Emoji") {
                        this.convertShapeToEditable(this.selectedActionIdx);
                    }
                    this.resizableBox = box;
                    this.origActionCopy = JSON.parse(JSON.stringify(this.actions[this.selectedActionIdx]));
                    if (handleId === "rot") {
                        this.isRotatingShape = true;
                    } else {
                        this.resizableBox.startDrag(handleId, [lx, ly]);
                        this.isResizingShape = true;
                    }
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }
            }
        }

        // 2. Check Vertex handles if in Vertex Edit Mode
        if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx] && this.vertexEditMode) {
            const act = this.actions[this.selectedActionIdx];
            const vHit = this.hitTestVertex(act, wx, wy);
            if (vHit) {
                this.draggingVertexInfo = vHit;
                this.canvas.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 3. Flood Fill Tool
        if (this.maintype === "Shapes" && this.currentShape === "Fill") {
            this.selectedActionIdx = null;
            this.vertexEditMode = false;
            const fillAct = {
                type: "fill",
                pos: [wx, wy],
                color: this.color,
                params: { ...(this.savedParams["Fill"] || {}) }
            };
            this.actions.push(fillAct);
            this.undoneActions.length = 0;
            this.isDrawing = false;
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        // 4. Text Tool Creation
        if (this.maintype === "Text" && this.currentShape.startsWith("Font")) {
            const hitIdx = this.hitTestShape(wx, wy);
            if (hitIdx !== null && this.actions[hitIdx]?.type === "text") {
                this.selectedActionIdx = hitIdx;
                this.isDrawing = false;
                this.redrawAll();
                return;
            }

            this.selectedActionIdx = null;
            this.vertexEditMode = false;
            const params = this.savedParams[this.currentShape] || {};
            const catKey = this.currentShape.replace("Font", "");
            const newTextAct = {
                type: "text",
                text: "Text",
                center: [wx, wy],
                angle: 0,
                color: this.color,
                fontFace: params[catKey] || "Inter",
                fontSize: params["Text Size"] || 32,
                bold: !!params["Bold"],
                italic: !!params["Italic"],
                outline: !!params["Text Outline"],
                bgPill: !!params["Background Pill"],
                bgOpacity: params["Bg Opacity (%)"] ?? 65,
                params: { ...params }
            };
            this.actions.push(newTextAct);
            this.undoneActions.length = 0;
            this.isDrawing = false;
            this.openFloatingTextEditor(this.actions.length - 1);
            return;
        }

        // 5. Hit test existing shapes
        const hitIdx = this.hitTestShape(wx, wy);
        if (hitIdx !== null) {
            this.selectedActionIdx = hitIdx;
            this.vertexEditMode = false;
            if (this.maintype === "Select") this.buildSelectModePanel();
        } else {
            this.selectedActionIdx = null;
            this.vertexEditMode = false;
            if (this.maintype === "Select") this.buildSelectModePanel();
        }
        this.redrawAll();

        if (this.maintype === "Shapes" && this.currentShape === "Line") {
            this.strokePoints = [[wx, wy]];
            this.lastStrokePos = [wx, wy];
        }

        this.canvas.setPointerCapture(e.pointerId);
    }

    onPointerMove(e) {
        if (!this.canvas || this.app.activeTab !== "tabPaint") return;

        if (this.isPanning) {
            const dx = e.clientX - this.lastPanMouse[0];
            const dy = e.clientY - this.lastPanMouse[1];
            this.panX += dx;
            this.panY += dy;
            this.lastPanMouse = [e.clientX, e.clientY];
            this.redrawAll();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        let [wx, wy] = this.screenToWorld(sx, sy);
        this.currentMouseWorld = [wx, wy];

        if (this.isHoveringCanvas) {
            this.renderPreviewPanel();
        }

        if (!this.isDrawing) return;

        if (Math.hypot(sx - this.dragStartScreen[0], sy - this.dragStartScreen[1]) > 5) {
            this.hasDragged = true;
        }

        // 1. Resizing / Moving via ResizableBox
        if (this.isResizingShape && this.resizableBox && this.origActionCopy) {
            const [[cx, cy], angle] = this.getActionCenterAndAngle(this.origActionCopy);
            const [lx, ly] = this.worldToLocal(wx, wy, cx, cy, angle);
            this.resizableBox.updateDrag([lx, ly]);
            this.applyBoxResize();
            this.redrawAll();
            return;
        }

        // 2. Rotating via ResizableBox 'rot' pin
        if (this.isRotatingShape && this.selectedActionIdx !== null && this.origActionCopy) {
            const act = this.actions[this.selectedActionIdx];
            const origAct = this.origActionCopy;
            const [[cx, cy], origAngle] = this.getActionCenterAndAngle(origAct);

            const startAng = Math.atan2(this.dragStartWorld[1] - cy, this.dragStartWorld[0] - cx);
            const currAng = Math.atan2(wy - cy, wx - cx);
            const diff = currAng - startAng;
            act.angle = origAngle + diff;

            if (act.type === "line") {
                act.points = origAct.points.map(([px, py]) => paintRotatePt(px, py, cx, cy, diff));
            } else if (act.type === "polygon_shape") {
                act.polygons = origAct.polygons.map(([ext, ints]) => [
                    ext.map(([vx, vy]) => paintRotatePt(vx, vy, cx, cy, diff)),
                    (ints || []).map(r => r.map(([vx, vy]) => paintRotatePt(vx, vy, cx, cy, diff)))
                ]);
            }
            this.redrawAll();
            return;
        }

        // 3. Dragging Individual Vertex
        if (this.draggingVertexInfo && this.selectedActionIdx !== null) {
            const act = this.actions[this.selectedActionIdx];
            const info = this.draggingVertexInfo;
            if (info[0] === "line") {
                act.points[info[1]] = [wx, wy];
            } else if (info[0] === "poly_ext") {
                act.polygons[info[1]][0][info[2]] = [wx, wy];
            } else if (info[0] === "poly_int") {
                act.polygons[info[1]][1][info[2]][info[3]] = [wx, wy];
            }
            this.redrawAll();
            return;
        }

        if (this.maintype !== "Shapes" || !this.hasDragged) return;

        if (this.selectedActionIdx !== null) {
            this.selectedActionIdx = null;
            this.vertexEditMode = false;
        }

        // 4. Live Freehand / Snapped Line Drawing
        if (this.currentShape === "Line") {
            const params = this.savedParams["Line"] || {};
            const selAngle = params["Line Angles"] || "Freehand";
            const angleSteps = {
                "30° Snap": Math.PI / 6,
                "45° Snap": Math.PI / 4,
                "90° Snap": Math.PI / 2
            };
            const step = angleSteps[selAngle];

            if (step && this.strokePoints.length > 0) {
                const [ax, ay] = this.strokePoints[this.strokePoints.length - 1];
                const dx = wx - ax, dy = wy - ay;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    const snapped = Math.round(Math.atan2(dy, dx) / step) * step;
                    wx = ax + dist * Math.cos(snapped);
                    wy = ay + dist * Math.sin(snapped);
                }
            }

            const minDist = params["Minimum Distance"] ?? 12;
            const minDistSq = minDist > 0 ? minDist * minDist : 1;
            if (this.lastStrokePos) {
                const dx = wx - this.lastStrokePos[0], dy = wy - this.lastStrokePos[1];
                if (dx * dx + dy * dy >= minDistSq) {
                    this.strokePoints.push([wx, wy]);
                    this.lastStrokePos = [wx, wy];
                }
            }

            this.redrawAll();
            this.drawLivePreviewStroke(wx, wy);
        } else {
            // 5. Live Parametric Shape Dragging
            this.redrawAll();
            this.drawLivePreviewShape(wx, wy);
        }
    }

    drawLivePreviewStroke(wx, wy) {
        if (!this.ctx) return;
        const [scale, ox, oy] = this.getTransformParams();
        const pts = [...this.strokePoints];
        if (!pts.length || pts[pts.length - 1][0] !== wx || pts[pts.length - 1][1] !== wy) {
            pts.push([wx, wy]);
        }

        this.ctx.save();
        this.ctx.translate(ox, oy);
        this.ctx.scale(scale, scale);
        drawCanvasLine(this.ctx, pts, this.savedParams["Line"] || {}, this.color, this.thickness);

        // Start-point snap ring indicator
        const [fx, fy] = pts[0];
        const r = 6.0 / Math.max(0.001, scale);
        this.ctx.beginPath();
        this.ctx.arc(fx, fy, r, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fill();
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 1.2 / Math.max(0.001, scale);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawLivePreviewShape(wx, wy) {
        if (!this.ctx) return;
        const [sx, sy] = this.dragStartWorld;
        let cx = sx, cy = sy, R = 0, angle = 0;

        if (this.currentShape === "Arrow") {
            const dx = wx - sx, dy = wy - sy;
            R = Math.hypot(dx, dy) / 2;
            cx = sx + dx / 2;
            cy = sy + dy / 2;
            angle = Math.atan2(dy, dx);
        } else {
            const dx = wx - cx, dy = wy - cy;
            R = Math.hypot(dx, dy);
            angle = this.polarRotation ? Math.atan2(dy, dx) : 0;
        }
        if (R <= 1) return;

        const [scale, ox, oy] = this.getTransformParams();
        const params = this.savedParams[this.currentShape] || {};

        this.ctx.save();
        this.ctx.translate(ox, oy);
        this.ctx.scale(scale, scale);
        this.ctx.translate(cx, cy);
        this.ctx.rotate(angle);

        if (this.currentShape === "Emoji") {
            drawEmojiOnContext(this.ctx, params["Emoji"] || "🙂", Math.max(14, R * 1.4), !!params["Grayscale"]);
        } else {
            traceShapePathOnContext(this.ctx, this.currentShape, params, R);
            this.ctx.fillStyle = hexToRgba(this.color, this.fillOpacity / 100.0);
            this.ctx.fill("evenodd");
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.thickness;
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    async onPointerUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
            return;
        }

        if (!this.isDrawing) return;
        this.isDrawing = false;
        try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}

        if (this.isRotatingShape) {
            this.isRotatingShape = false;
            this.origActionCopy = null;
            this.invalidateFillsAfter(this.selectedActionIdx);
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        if (this.isResizingShape) {
            if (this.resizableBox) this.resizableBox.stopDrag();
            this.isResizingShape = false;
            this.origActionCopy = null;
            this.invalidateFillsAfter(this.selectedActionIdx);
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        if (this.draggingVertexInfo) {
            if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]) {
                this.recalculateShapeCenter(this.actions[this.selectedActionIdx]);
                this.invalidateFillsAfter(this.selectedActionIdx);
            }
            this.draggingVertexInfo = null;
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const [wx, wy] = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

        if (!this.hasDragged) {
            const hitIdx = this.hitTestShape(wx, wy);
            if (hitIdx !== null) {
                this.selectedActionIdx = hitIdx;
                this.vertexEditMode = false;
                if (this.maintype === "Select") this.buildSelectModePanel();
            } else {
                this.selectedActionIdx = null;
                this.vertexEditMode = false;
                if (this.maintype === "Shapes" && this.currentShape !== "Line" && this.currentShape !== "Fill") {
                    const action = {
                        type: "shape",
                        shape: this.currentShape,
                        center: [wx, wy],
                        radius: 65,
                        angle: 0,
                        color: this.color,
                        fillOpacity: this.fillOpacity,
                        thickness: this.thickness,
                        params: { ...(this.savedParams[this.currentShape] || {}) }
                    };
                    this.undoneActions.length = 0;
                    await this.performBooleanOperation(this.polyMode, action);
                    this.selectedActionIdx = this.actions.length - 1;
                    this.commitPaintChanges();
                }
            }
            this.redrawAll();
            return;
        }

        if (this.maintype !== "Shapes") return;

        if (this.currentShape === "Line") {
            const pts = [...this.strokePoints];
            if (!pts.length || pts[pts.length - 1][0] !== wx || pts[pts.length - 1][1] !== wy) {
                pts.push([wx, wy]);
            }
            if (pts.length >= 2) {
                let fillPoly = false;
                if (pts.length >= 3) {
                    const [scale] = this.getTransformParams();
                    const d = Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
                    if (d < 15.0 / Math.max(0.1, scale)) fillPoly = true;
                }
                const action = {
                    type: "line",
                    points: pts,
                    color: this.color,
                    fillOpacity: this.fillOpacity,
                    thickness: this.thickness,
                    params: { ...(this.savedParams["Line"] || {}) },
                    fill: fillPoly
                };
                this.undoneActions.length = 0;
                await this.performBooleanOperation(this.polyMode, action);
                this.selectedActionIdx = null;
                this.commitPaintChanges();
            }
        } else {
            const [sx, sy] = this.dragStartWorld;
            let cx = sx, cy = sy, R = 0, angle = 0;
            if (this.currentShape === "Arrow") {
                const dx = wx - sx, dy = wy - sy;
                R = Math.hypot(dx, dy) / 2;
                cx = sx + dx / 2;
                cy = sy + dy / 2;
                angle = Math.atan2(dy, dx);
            } else {
                const dx = wx - cx, dy = wy - cy;
                R = Math.hypot(dx, dy);
                angle = this.polarRotation ? Math.atan2(dy, dx) : 0;
            }
            if (R > 3) {
                const action = {
                    type: "shape",
                    shape: this.currentShape,
                    center: [cx, cy],
                    radius: R,
                    angle,
                    color: this.color,
                    fillOpacity: this.fillOpacity,
                    thickness: this.thickness,
                    params: { ...(this.savedParams[this.currentShape] || {}) }
                };
                this.undoneActions.length = 0;
                await this.performBooleanOperation(this.polyMode, action);
                this.selectedActionIdx = null;
                this.commitPaintChanges();
            }
        }

        this.redrawAll();
    }

    onDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const [wx, wy] = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const hitIdx = this.hitTestShape(wx, wy);
        if (hitIdx !== null) {
            const act = this.actions[hitIdx];
            if (act.type === "text") {
                this.openFloatingTextEditor(hitIdx);
                return;
            }
            this.convertShapeToEditable(hitIdx);
            this.selectedActionIdx = hitIdx;
            this.vertexEditMode = true;
            if (this.maintype === "Select") this.buildSelectModePanel();
            this.redrawAll();
        }
    }

    handleKeyDown(e) {
        if (this.activeTextIdx !== null) return false;

        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key = e.key.toLowerCase();

        if (ctrl && key === "z") {
            e.preventDefault();
            if (shift) this.redo();
            else this.undo();
            return true;
        }
        if (ctrl && key === "y") {
            e.preventDefault();
            this.redo();
            return true;
        }

        // Boolean operation shortcuts: Ctrl+U, Ctrl+I, Ctrl+S, Ctrl+E, Ctrl+D
        const boolShortcuts = { u: "union", i: "intersect", s: "symmetric", e: "erase", d: "disjoint" };
        if (ctrl && boolShortcuts[key]) {
            e.preventDefault();
            this.performBooleanOperation(boolShortcuts[key], null);
            return true;
        }

        if (e.key === "Delete" || e.key === "Backspace") {
            if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]) {
                e.preventDefault();
                const idx = this.selectedActionIdx;
                if (!this.vertexEditMode) {
                    this.actions.splice(idx, 1);
                    this.selectedActionIdx = null;
                    this.vertexEditMode = false;
                    this.invalidateFillsAfter(idx);
                    this.commitPaintChanges();
                    if (this.maintype === "Select") this.buildSelectModePanel();
                    this.redrawAll();
                } else {
                    const act = this.actions[idx];
                    const [mx, my] = this.currentMouseWorld;
                    const vHit = this.hitTestVertex(act, mx, my);
                    if (vHit) {
                        this.deleteVertexFromShape(act, vHit);
                        this.invalidateFillsAfter(idx);
                        this.commitPaintChanges();
                        this.redrawAll();
                    }
                }
                return true;
            }
        }
        return false;
    }

    // ==================================================================
    // STAGE SYNC & FULL CANVAS REDRAW
    // ==================================================================
    syncWithActiveItem() {
        ensurePolyBoolLoaded();
        this.commitActiveText();
        const itm = this.item;
        if (!itm) return;

        // Build clean effects-only background canvas (before paint actions)
        const src = itm.getEffectsOnlySource ? itm.getEffectsOnlySource() : itm.imgElement;
        if (src) {
            this.origW = src.naturalWidth || src.videoWidth || src.width || itm.w || 1920;
            this.origH = src.naturalHeight || src.videoHeight || src.height || itm.h || 1080;
            const cvs = document.createElement("canvas");
            cvs.width = this.origW;
            cvs.height = this.origH;
            cvs.getContext("2d").drawImage(src, 0, 0, this.origW, this.origH);
            this.bgCanvas = cvs;
        }

        this.selectedActionIdx = null;
        this.vertexEditMode = false;
        this.resizeMainCanvas();
        this.redrawAll();
        this.renderPreviewPanel();
    }

    resizeMainCanvas() {
        if (!this.canvas || !this.canvasWrap) return;
        const w = Math.max(300, this.canvasWrap.clientWidth - 4);
        const h = Math.max(200, this.canvasWrap.clientHeight - 4);
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }

    redrawAll() {
        if (!this.ctx || !this.canvas) return;
        this.resizeMainCanvas();

        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.fillStyle = "#0b0f19";
        ctx.fillRect(0, 0, cw, ch);

        if (!this.bgCanvas) return;

        const [scale, ox, oy] = this.getTransformParams();
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        ctx.drawImage(this.bgCanvas, 0, 0, this.origW, this.origH);

        let startIndex = 0;
        for (let i = this.actions.length - 1; i >= 0; i--) {
            if (this.actions[i].type === "clear") {
                startIndex = i + 1;
                break;
            }
        }

        for (let i = startIndex; i < this.actions.length; i++) {
            const act = this.actions[i];
            if (act.type === "fill") {
                if (!act.cachedCanvas) {
                    act.cachedCanvas = computeFloodFillLayer(this.bgCanvas, this.actions, i);
                }
                if (act.cachedCanvas) {
                    ctx.drawImage(act.cachedCanvas, 0, 0, this.origW, this.origH);
                }
            } else {
                drawSinglePaintAction(ctx, act);
            }
        }

        // Draw Selection / Vertex Edit Overlays
        if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]) {
            const act = this.actions[this.selectedActionIdx];
            if (act.isEditing) {
                // Skip box while inline textarea is open
            } else if (this.vertexEditMode) {
                const verts = this.getActionVertices(act);
                if (verts.length) {
                    const xs = verts.map(v => v[0]);
                    const ys = verts.map(v => v[1]);
                    const minX = Math.min(...xs), maxX = Math.max(...xs);
                    const minY = Math.min(...ys), maxY = Math.max(...ys);

                    ctx.save();
                    ctx.strokeStyle = "rgba(255, 160, 0, 0.85)";
                    ctx.lineWidth = Math.max(1, 2 / scale);
                    ctx.setLineDash([4 / scale, 4 / scale]);
                    ctx.strokeRect(minX - 4 / scale, minY - 4 / scale, (maxX - minX) + 8 / scale, (maxY - minY) + 8 / scale);
                    ctx.setLineDash([]);

                    const hs = 8 / scale;
                    ctx.fillStyle = "#ffe600";
                    ctx.strokeStyle = "#ff1e1e";
                    ctx.lineWidth = Math.max(1, 1.8 / scale);
                    verts.forEach(([vx, vy]) => {
                        ctx.fillRect(vx - hs / 2, vy - hs / 2, hs, hs);
                        ctx.strokeRect(vx - hs / 2, vy - hs / 2, hs, hs);
                    });

                    // Live vertex interior angle readout while dragging
                    if (this.draggingVertexInfo) {
                        const info = this.draggingVertexInfo;
                        let pts = [], vIdx = -1, isClosed = true;
                        if (info[0] === "line") {
                            pts = act.points; vIdx = info[1]; isClosed = !!act.fill;
                        } else if (info[0] === "poly_ext") {
                            pts = act.polygons[info[1]][0]; vIdx = info[2];
                        } else if (info[0] === "poly_int") {
                            pts = act.polygons[info[1]][1][info[2]]; vIdx = info[3];
                        }
                        if (pts && vIdx >= 0 && vIdx < pts.length) {
                            const deg = paintCalculateVertexAngle(pts, vIdx, isClosed);
                            if (deg !== null) {
                                const [vx, vy] = pts[vIdx];
                                const labelStr = `${deg.toFixed(1)}°`;
                                const fSize = Math.max(10, Math.round(13 / scale));
                                ctx.font = `bold ${fSize}px Inter, sans-serif`;
                                const tw = ctx.measureText(labelStr).width;
                                const tx = vx + 12 / scale;
                                const ty = vy - 22 / scale;

                                ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
                                ctx.strokeStyle = "#ffe600";
                                ctx.lineWidth = 1.2 / scale;
                                ctx.beginPath();
                                ctx.roundRect(tx - 4 / scale, ty - 2 / scale, tw + 8 / scale, fSize + 6 / scale, 4 / scale);
                                ctx.fill();
                                ctx.stroke();

                                ctx.fillStyle = "#ffe600";
                                ctx.textBaseline = "top";
                                ctx.fillText(labelStr, tx, ty);
                            }
                        }
                    }
                    ctx.restore();
                }
            } else {
                // Draw ResizableBox
                if (!this.isResizingShape || !this.resizableBox) {
                    const [[cx, cy], angle] = this.getActionCenterAndAngle(act);
                    const bounds = this.getActionLocalBounds(act);
                    if (bounds) {
                        const hs = PAINT_HANDLE_SIZE / Math.max(0.001, scale);
                        const pad = 10.0 / Math.max(0.001, scale);
                        const box = new PaintResizableBox(bounds[0], bounds[1], bounds[2], bounds[3], hs, pad);
                        ctx.save();
                        ctx.translate(cx, cy);
                        ctx.rotate(angle);
                        box.draw(ctx, scale);
                        ctx.restore();
                    }
                } else if (this.origActionCopy) {
                    const box = this.resizableBox;
                    box.handleSize = PAINT_HANDLE_SIZE / Math.max(0.001, scale);
                    box.hitPadding = 10.0 / Math.max(0.001, scale);
                    const [[origCx, origCy], origAngle] = this.getActionCenterAndAngle(this.origActionCopy);
                    ctx.save();
                    ctx.translate(origCx, origCy);
                    ctx.rotate(origAngle);
                    box.draw(ctx, scale);
                    ctx.restore();
                }
            }
        }

        ctx.restore();
    }
}

window.PhotoPaintEditor = PhotoPaintEditor;
