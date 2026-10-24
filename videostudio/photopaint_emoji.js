"use strict";

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
        "🐳","🐋","鲨","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈",
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
// MODAL CONTROLLER FOR EMOJI & COUNTRY FLAGS
// ======================================================================
function openPaintEmojiPickerModal(initialEmoji, onSelectCallback) {
    const modal = document.getElementById("paintEmojiModal");
    if (!modal) return;
    modal.classList.remove("hidden");

    let modalSelectedEmoji = initialEmoji || "🙂";

    const tabsContainer = document.getElementById("paintEmojiTabs");
    const contentContainer = document.getElementById("paintEmojiContent");
    const btnSet = document.getElementById("btnPaintEmojiSet");
    const btnCancel = document.getElementById("btnPaintEmojiCancel");
    const lblStatus = document.getElementById("lblPaintEmojiStatus");

    const updateSelectedUI = (em) => {
        modalSelectedEmoji = em;
        if (btnSet) btnSet.textContent = `Set Emoji (${em})`;
        if (lblStatus) lblStatus.textContent = `Selected: ${em}`;
    };
    updateSelectedUI(modalSelectedEmoji);

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
                const isSel = em === modalSelectedEmoji;
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
                    const isSel = flag === modalSelectedEmoji;
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
        if (typeof onSelectCallback === "function") {
            onSelectCallback(modalSelectedEmoji);
        }
        modal.classList.add("hidden");
    };

    btnCancel.onclick = () => {
        modal.classList.add("hidden");
    };
}

window.PAINT_EMOJI_CATEGORIES = PAINT_EMOJI_CATEGORIES;
window.PAINT_COUNTRY_DATA = PAINT_COUNTRY_DATA;
window.openPaintEmojiPickerModal = openPaintEmojiPickerModal;