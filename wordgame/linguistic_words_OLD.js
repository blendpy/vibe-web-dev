/**
 * linguistic_words.js
 * External word database grouped by complexity level.
 * Edit this file directly to add, remove, or reorganize words.
 */

const WORD_DATABASE = {
    beginner: {
        label: "Level 1: Beginner (4–5 Letters)",
        description: "Short, foundational words ideal for learning tile mechanics.",
        words: [
            {
                word: "STOP",
                pronunciation: "staap",
                pos: "noun/verb",
                meaning: "Come to an end; cease from motion or action.",
                sample: "Please stop at the red intersection light."
            },
            {
                word: "SPARK",
                pronunciation: "spaark",
                pos: "noun/verb",
                meaning: "A small fiery particle or a sudden flash of inspiration.",
                sample: "A single spark of curiosity started the entire project."
            },
            {
                word: "CRISP",
                pronunciation: "krisp",
                pos: "adjective",
                meaning: "Firm, dry, and brittle; pleasantly cool and invigorating.",
                sample: "We walked through the forest on a crisp autumn morning."
            },
            {
                word: "ORBIT",
                pronunciation: "or-bit",
                pos: "noun/verb",
                meaning: "The curved path of a celestial object around a star or planet.",
                sample: "The satellite completed a full orbit around the Earth."
            },
            {
                word: "PRISM",
                pronunciation: "pri-zuhm",
                pos: "noun",
                meaning: "A transparent geometric solid that separates white light into a spectrum.",
                sample: "Sunlight passed through the glass prism and cast a rainbow on the wall."
            },
            {
                word: "QUEST",
                pronunciation: "kwest",
                pos: "noun",
                meaning: "A long or arduous search for something of great value.",
                sample: "The explorers began their quest across the uncharted mountain range."
            }
        ]
    },

    intermediate: {
        label: "Level 2: Intermediate (6–7 Letters)",
        description: "Medium-length vocabulary for practicing multi-step tile shifts.",
        words: [
            {
                word: "FELINE",
                pronunciation: "fee-line",
                pos: "adjective/noun",
                meaning: "Relating to or characteristics of members of the cat family.",
                sample: "The leopard moved through the tall grass with quiet feline grace."
            },
            {
                word: "SOLVING",
                pronunciation: "saal-ving",
                pos: "verb",
                meaning: "Finding a workable answer or explanation for a complex problem.",
                sample: "We are solving this mechanical word puzzle step by step."
            },
            {
                word: "ZENITH",
                pronunciation: "zee-nith",
                pos: "noun",
                meaning: "The highest point reached by a celestial body or a peak of success.",
                sample: "At noon the summer sun reached its zenith directly overhead."
            },
            {
                word: "CIPHER",
                pronunciation: "sai-fer",
                pos: "noun/verb",
                meaning: "A secret or disguised way of writing; a cryptographic code.",
                sample: "Historians spent decades decoding the ancient royal cipher."
            },
            {
                word: "VERDANT",
                pronunciation: "vur-dnt",
                pos: "adjective",
                meaning: "Green with lush grass or rich growing vegetation.",
                sample: "Spring rain transformed the dry hills into a verdant valley."
            },
            {
                word: "CASCADE",
                pronunciation: "kas-kayd",
                pos: "noun/verb",
                meaning: "A small steep waterfall or a series of stages in rapid succession.",
                sample: "Clear mountain water poured down a rocky cascade into the pool."
            }
        ]
    },

    advanced: {
        label: "Level 3: Advanced (8–9 Letters)",
        description: "Longer structural vocabulary demanding careful pivot and rotation planning.",
        words: [
            {
                word: "LABYRINTH",
                pronunciation: "la-buh-rinth",
                pos: "noun",
                meaning: "An intricate, irregular network of winding passages or paths.",
                sample: "The old fortress contained a stone labyrinth beneath its courtyard."
            },
            {
                word: "RESONANCE",
                pronunciation: "reh-zuhn-uhns",
                pos: "noun",
                meaning: "The quality in a sound of being deep, full, and reverberating.",
                sample: "The wooden concert hall gave the cello a warm acoustic resonance."
            },
            {
                word: "EPHEMERAL",
                pronunciation: "uh-feh-muh-ruhl",
                pos: "adjective",
                meaning: "Lasting for only a brief period of time; transitory.",
                sample: "Desert wildflowers produce an ephemeral display after rare rainstorms."
            },
            {
                word: "SYMMETRY",
                pronunciation: "sim-uh-tree",
                pos: "noun",
                meaning: "Balanced proportions and exact correspondence between opposite halves.",
                sample: "Snowflakes exhibit six-fold radial symmetry under a microscope."
            },
            {
                word: "CATALYST",
                pronunciation: "kat-uh-list",
                pos: "noun",
                meaning: "A substance or event that accelerates a reaction or significant change.",
                sample: "The new invention served as a catalyst for renewable energy research."
            }
        ]
    },

    expert: {
        label: "Level 4: Expert (10+ Letters)",
        description: "High-complexity words for mastering advanced spatial permutations.",
        words: [
            {
                word: "TESSELLATION",
                pronunciation: "teh-suh-lay-shuhn",
                pos: "noun",
                meaning: "A geometric arrangement of shapes fitted closely together without gaps or overlaps.",
                sample: "Islamic architecture is renowned for intricate ceramic tile tessellation."
            },
            {
                word: "LUMINESCENCE",
                pronunciation: "loo-muh-neh-sns",
                pos: "noun",
                meaning: "Emission of light by a substance not resulting from heat.",
                sample: "Ocean waves glowed at night with bright blue bioluminescence and luminescence."
            },
            {
                word: "EQUILIBRIUM",
                pronunciation: "ee-kwuh-li-bree-uhm",
                pos: "noun",
                meaning: "A state in which opposing forces or influences are balanced.",
                sample: "The suspension bridge maintained structural equilibrium during high winds."
            },
            {
                word: "CHRONOLOGICAL",
                pronunciation: "kraa-nuh-laa-jih-kuhl",
                pos: "adjective",
                meaning: "Arranged in the exact order in which events occurred in time.",
                sample: "The museum archive organized the historical letters in chronological order."
            },
            {
                word: "KALEIDOSCOPE",
                pronunciation: "kuh-lai-duh-skowp",
                pos: "noun",
                meaning: "A tube of mirrors and colored glass producing shifting symmetrical patterns.",
                sample: "Stained glass windows turned the sunlit floor into a vivid kaleidoscope."
            }
        ]
    }
};

// Expose globally on window so index.html always finds it
window.WORD_DATABASE = WORD_DATABASE;