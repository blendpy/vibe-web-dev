/**
 * linguistic_words.js
 * External word database grouped by complexity level.
 * Edit this file directly to add, remove, or reorganize words.
 */

const WORD_DATABASE = {
    beginner: {
        label: "Level 1: Beginner (4–6 Letters)",
        description: "Short, foundational words ideal for learning tile mechanics.",
        words: [
            {
word: "speech",
pronunciation: "speech",
pos: "noun",
meaning: "The expression of thoughts and feelings by articulate sounds; a formal address or discourse delivered to an audience.",
sample: "The mayor gave a passionate speech about community unity."
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
            },
            {
                word: "ADAPT",
                pronunciation: "uh-dapt",
                pos: "verb",
                meaning: "To adjust or modify to suit new conditions or a different purpose.",
                sample: "Animals must learn to adapt when their natural environment changes."
            },
            {
                word: "EXCEL",
                pronunciation: "ek-sel",
                pos: "verb",
                meaning: "To be exceptionally good at or proficient in an activity or subject.",
                sample: "With consistent practice, she began to excel in her piano studies."
            },
            {
                word: "EMIT",
                pronunciation: "ee-mit",
                pos: "verb",
                meaning: "To produce and discharge something, especially gas, radiation, or sound.",
                sample: "The old factory chimney began to emit dark clouds of smoke."
            },
            {
                word: "FEEBLE",
                pronunciation: "fee-buhl",
                pos: "adjective",
                meaning: "Lacking physical strength, especially as a result of age or illness.",
                sample: "The injured bird made a feeble attempt to flutter its wings."
            },
            {
                word: "HOARSE",
                pronunciation: "hors",
                pos: "adjective",
                meaning: "Making a rough and harsh sound, typically as a result of shouting or illness.",
                sample: "After cheering for hours at the game, his voice became hoarse."
            },
            {
                word: "RATION",
                pronunciation: "rash-uhn",
                pos: "noun/verb",
                meaning: "A fixed allowance of provisions or food, especially for soldiers or civilians during a shortage.",
                sample: "The hikers carefully divided their daily water ration."
            },
            {
                word: "SCARCE",
                pronunciation: "skars",
                pos: "adjective",
                meaning: "Insufficient for the demand; occurring in small quantities.",
                sample: "Fresh water became scarce during the prolonged desert drought."
            },
            {
                word: "HASTE",
                pronunciation: "hayst",
                pos: "noun",
                meaning: "Excessive speed or urgency of movement or action.",
                sample: "In his haste to catch the train, he left his umbrella behind."
            },
            {
                word: "EVADE",
                pronunciation: "ee-vayd",
                pos: "verb",
                meaning: "To escape or avoid, especially by cleverness or trickery.",
                sample: "The clever fox managed to evade the tracking hounds."
            },
            {
                word: "GLUM",
                pronunciation: "glum",
                pos: "adjective",
                meaning: "Looking or feeling dejected; sullen and quiet.",
                sample: "The team sat in silence with glum expressions after losing the match."
            },
            {
                word: "STERN",
                pronunciation: "sturn",
                pos: "adjective",
                meaning: "Serious and unrelenting, especially in the assertion of authority.",
                sample: "The teacher gave a stern warning about the upcoming exam rules."
            },
            {
                word: "UNRULY",
                pronunciation: "un-roo-lee",
                pos: "adjective",
                meaning: "Disorderly and disruptive and not amenable to discipline.",
                sample: "The shepherd struggled to keep the unruly sheep inside the pen."
            },
            {
                word: "LURCH",
                pronunciation: "lurch",
                pos: "verb/noun",
                meaning: "To make an abrupt, unsteady movement, especially from side to side.",
                sample: "The sudden storm caused the large ship to lurch violently."
            },
            {
                word: "RECOIL",
                pronunciation: "ree-koyl",
                pos: "verb",
                meaning: "To suddenly spring or flinch back in fear, horror, or disgust.",
                sample: "She could not help but recoil when the snake hissed near her foot."
            },
            {
                word: "URGENT",
                pronunciation: "ur-juhnt",
                pos: "adjective",
                meaning: "Requiring immediate action or attention.",
                sample: "The hospital received an urgent message regarding the blood supply."
            },
            {
                word: "WITHER",
                pronunciation: "with-ur",
                pos: "verb",
                meaning: "To fall into decay or decline; to become dry and shriveled.",
                sample: "The unwatered flowers began to wither under the blazing sun."
            }
        ]
    },

    intermediate: {
        label: "Level 2: Intermediate (6–8 Letters)",
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
            },
            {
                word: "FORFEIT",
                pronunciation: "for-fit",
                pos: "verb/noun",
                meaning: "To lose or lose the right to something as a penalty for an error or offense.",
                sample: "If the team arrives late, they will forfeit the championship game."
            },
            {
                word: "LOATHE",
                pronunciation: "lowth",
                pos: "verb",
                meaning: "To feel intense dislike or disgust for something.",
                sample: "He tends to loathe waking up early on freezing winter mornings."
            },
            {
                word: "MEAGER",
                pronunciation: "mee-gur",
                pos: "adjective",
                meaning: "Lacking in quantity or quality; lean or thin.",
                sample: "The refugees survived on a meager ration of bread and water."
            },
            {
                word: "VERIFY",
                pronunciation: "ver-uh-fy",
                pos: "verb",
                meaning: "To make sure or demonstrate that something is true, accurate, or justified.",
                sample: "Please check your email receipt to verify the shipping address."
            },
            {
                word: "DIVERGE",
                pronunciation: "dy-vurj",
                pos: "verb",
                meaning: "To separate from another route and go in a different direction.",
                sample: "The two hiking trails diverge near the edge of the deep forest."
            },
            {
                word: "FATIGUE",
                pronunciation: "fuh-teeg",
                pos: "noun/verb",
                meaning: "Extreme tiredness resulting from mental or physical exertion or illness.",
                sample: "The exhausted runner felt overwhelming fatigue after crossing the line."
            },
            {
                word: "REFRAIN",
                pronunciation: "ree-frayn",
                pos: "verb",
                meaning: "To stop oneself from doing something.",
                sample: "Please refrain from talking loudly inside the quiet library hall."
            },
            {
                word: "BEWILDER",
                pronunciation: "bih-wil-dur",
                pos: "verb",
                meaning: "To perplex and confuse someone greatly.",
                sample: "The complex instructions began to bewilder the new students."
            },
            {
                word: "BOYCOTT",
                pronunciation: "boy-kaat",
                pos: "verb/noun",
                meaning: "To withdraw from commercial or social relations as a punishment or protest.",
                sample: "Citizens decided to boycott the company following unfair wage cuts."
            },
            {
                word: "CONDEMN",
                pronunciation: "kuhn-dem",
                pos: "verb",
                meaning: "To express complete disapproval of, typically in public.",
                sample: "World leaders joined together to condemn the act of violence."
            },
            {
                word: "MOMENTUM",
                pronunciation: "moh-men-tum",
                pos: "noun",
                meaning: "The impetus gained by a moving object; driving force of a process.",
                sample: "The political campaign gained significant momentum after the debate."
            },
            {
                word: "TRUDGE",
                pronunciation: "truhj",
                pos: "verb/noun",
                meaning: "To walk slowly and with heavy steps, typically because of exhaustion.",
                sample: "The weary travelers had to trudge through the deep snowbanks."
            },
            {
                word: "FACTOR",
                pronunciation: "fak-tur",
                pos: "noun/verb",
                meaning: "A circumstance, fact, or influence that contributes to a result.",
                sample: "Weather conditions were a major factor in delaying the flight."
            },
            {
                word: "LINGER",
                pronunciation: "ling-gur",
                pos: "verb",
                meaning: "To stay in a place longer than necessary because of a reluctance to leave.",
                sample: "A sweet scent of baking bread continued to linger in the kitchen."
            },
            {
                word: "NURTURE",
                pronunciation: "nur-chur",
                pos: "verb/noun",
                meaning: "To care for and encourage the growth or development of someone or something.",
                sample: "Gardeners work hard to nurture fragile seedlings through the spring."
            },
            {
                word: "SHRILL",
                pronunciation: "shril",
                pos: "adjective",
                meaning: "Having or emitting a high-pitched and piercing sound or tone.",
                sample: "The whistle blew a shrill blast to signal the end of the shift."
            },
            {
                word: "SYMBOL",
                pronunciation: "sim-buhl",
                pos: "noun",
                meaning: "A thing that represents or stands for something else, especially a material object.",
                sample: "The dove is universally recognized as a symbol of peace."
            },
            {
                word: "UNIQUE",
                pronunciation: "yoo-neek",
                pos: "adjective",
                meaning: "Being the only one of its kind; unlike anything else.",
                sample: "Each snowflake features a completely unique crystalline pattern."
            },
            {
                word: "FRIGID",
                pronunciation: "frij-id",
                pos: "adjective",
                meaning: "Very cold in temperature.",
                sample: "The expedition team struggled to survive in the frigid arctic winds."
            },
            {
                word: "IMPAIR",
                pronunciation: "im-pair",
                pos: "verb",
                meaning: "To weaken or damage something, especially a human faculty or function.",
                sample: "Loud machinery noises can impair your hearing over time."
            },
            {
                word: "STERN",
                pronunciation: "sturn",
                pos: "adjective",
                meaning: "Serious and unrelenting.",
                sample: "The captain maintained a stern expression throughout the stormy voyage."
            },
            {
                word: "APPEASE",
                pronunciation: "uh-peez",
                pos: "verb",
                meaning: "To pacify or placate someone by acceding to their demands.",
                sample: "The company offered refunds to appease frustrated customers."
            },
            {
                word: "EXEMPT",
                pronunciation: "ig-zempt",
                pos: "adjective/verb",
                meaning: "Free from an obligation or liability imposed on others.",
                sample: "Historic buildings are often exempt from certain modern zoning laws."
            },
            {
                word: "LURCH",
                pronunciation: "lurch",
                pos: "verb",
                meaning: "To make an abrupt, unsteady movement.",
                sample: "The old bus gave a sudden lurch before coming to a complete stop."
            },
            {
                word: "RECOIL",
                pronunciation: "ree-koyl",
                pos: "verb",
                meaning: "To suddenly spring back in horror or disgust.",
                sample: "He had to recoil from the intense heat of the campfire."
            },
            {
                word: "RESOLVE",
                pronunciation: "ree-zaalv",
                pos: "verb/noun",
                meaning: "To settle or find a solution to a problem; firm determination.",
                sample: "They met to resolve their long-standing business dispute."
            },
            {
                word: "COMMENCE",
                pronunciation: "kuh-mens",
                pos: "verb",
                meaning: "To begin or start.",
                sample: "The graduation ceremony will commence promptly at ten o'clock."
            },
            {
                word: "CURRENT",
                pronunciation: "kur-uhnt",
                pos: "adjective/noun",
                meaning: "Belonging to the present time; a body of water or air moving in a definite direction.",
                sample: "Strong river currents made it dangerous to swim across."
            },
            {
                word: "EXTENSIVE",
                pronunciation: "ik-sten-siv",
                pos: "adjective",
                meaning: "Covering or affecting a large area; large in amount or scale.",
                sample: "The ancient library underwent extensive renovations last year."
            },
            {
                word: "PLUMMET",
                pronunciation: "plum-it",
                pos: "verb",
                meaning: "To fall or drop straight down at high speed.",
                sample: "Temperatures began to plummet as soon as the sun went down."
            },
            {
                word: "RECOUNT",
                pronunciation: "ree-kownt",
                pos: "verb/noun",
                meaning: "To give an account of an event or experience; an act of counting again.",
                sample: "Grandfather loved to recount stories of his youth on the farm."
            },
            {
                word: "STABLE",
                pronunciation: "stay-buhl",
                pos: "adjective/noun",
                meaning: "Not likely to change or fail; firmly established.",
                sample: "The patient's condition is finally stable after the surgery."
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
            },
            {
                word: "ABUNDANT",
                pronunciation: "uh-bun-dunt",
                pos: "adjective",
                meaning: "Existing or available in large quantities; overflowing.",
                sample: "There was an abundant supply of fresh fruit at the summer market."
            },
            {
                word: "AUTHENTIC",
                pronunciation: "aw-then-tik",
                pos: "adjective",
                meaning: "Of undisputed origin; genuine and not a copy or imitation.",
                sample: "The art expert confirmed the painting was an authentic masterpiece."
            },
            {
                word: "DEDICATE",
                pronunciation: "ded-uh-kayt",
                pos: "verb",
                meaning: "To devote time, effort, or oneself to a particular task or purpose.",
                sample: "She decided to dedicate all her weekends to animal rescue work."
            },
            {
                word: "EFFICIENT",
                pronunciation: "ih-fish-uhnt",
                pos: "adjective",
                meaning: "Achieving maximum productivity with minimum wasted effort or expense.",
                sample: "The new engine design is far more efficient than older models."
            },
            {
                word: "MAJESTIC",
                pronunciation: "muh-jes-tik",
                pos: "adjective",
                meaning: "Having or showing impressive beauty or dignity.",
                sample: "The majestic mountains rose high above the misty valley floor."
            },
            {
                word: "MAKESHIFT",
                pronunciation: "mayk-shift",
                pos: "adjective/noun",
                meaning: "Serving as a temporary substitute for something else.",
                sample: "They built a makeshift shelter using canvas and fallen tree branches."
            },
            {
                word: "PERCEIVE",
                pronunciation: "pur-seev",
                pos: "verb",
                meaning: "To become aware or conscious of something; to come to realize.",
                sample: "Animals can often perceive changes in weather long before humans do."
            },
            {
                word: "PROMINENT",
                pronunciation: "praa-muh-nunt",
                pos: "adjective",
                meaning: "Important, famous, or projecting outward from a surface.",
                sample: "A prominent scientist gave the keynote speech at the conference."
            },
            {
                word: "RIGOROUS",
                pronunciation: "rig-ur-us",
                pos: "adjective",
                meaning: "Extremely thorough, exhaustive, or accurate; strictly applied.",
                sample: "Astronauts must undergo rigorous physical training before launching."
            },
            {
                word: "STEALTHY",
                pronunciation: "stel-thee",
                pos: "adjective",
                meaning: "Behaving, moving, or done in a cautious and secretive manner.",
                sample: "The cat made stealthy movements as it stalked across the rug."
            },
            {
                word: "UNANIMOUS",
                pronunciation: "yoo-na-nuh-mus",
                pos: "adjective",
                meaning: "Fully in agreement or sharing the same opinion.",
                sample: "The committee reached a unanimous decision on the new budget."
            },
            {
                word: "INTERPRET",
                pronunciation: "in-ter-prit",
                pos: "verb",
                meaning: "To explain the meaning of something or understand actions in a particular way.",
                sample: "Art critics spent hours trying to interpret the meaning of the painting."
            },
            {
                word: "PULVERIZE",
                pronunciation: "pul-vuh-ryz",
                pos: "verb",
                meaning: "To reduce to fine particles or crush completely.",
                sample: "The heavy machinery can pulverize solid rock into gravel."
            },
            {
                word: "REMINISCE",
                pronunciation: "reh-muh-nis",
                pos: "verb",
                meaning: "To indulge in enjoyable recollection of past events.",
                sample: "Old friends gathered around the fire to reminisce about high school."
            },
            {
                word: "SOLITUDE",
                pronunciation: "saa-luh-tood",
                pos: "noun",
                meaning: "The state or situation of being alone, often by choice.",
                sample: "He enjoyed spending quiet afternoons of solitude in the cabin."
            },
            {
                word: "DETERIORATE",
                pronunciation: "dih-tir-ee-uh-rayt",
                pos: "verb",
                meaning: "To become progressively worse over time.",
                sample: "The metal bridge began to deteriorate due to heavy rain and rust."
            },
            {
                word: "INTERVENE",
                pronunciation: "in-tur-veen",
                pos: "verb",
                meaning: "To come between so as to prevent or alter a result or course of events.",
                sample: "A teacher had to intervene when the playground argument escalated."
            },
            {
                word: "PERSISTENT",
                pronunciation: "pur-sis-tunt",
                pos: "adjective",
                meaning: "Continuing firmly in a course of action despite difficulty or opposition.",
                sample: "Her persistent efforts eventually earned her a spot on the team."
            },
            {
                word: "RELUCTANT",
                pronunciation: "ri-luk-tunt",
                pos: "adjective",
                meaning: "Unwilling and hesitant; disinclined.",
                sample: "The puppy was reluctant to jump into the swimming pool."
            },
            {
                word: "SUBSEQUENT",
                pronunciation: "sub-suh-kwent",
                pos: "adjective",
                meaning: "Coming after something in time; following.",
                sample: "The initial error was corrected in all subsequent software releases."
            },
            {
                word: "DETERMINED",
                pronunciation: "dih-tur-mind",
                pos: "adjective",
                meaning: "Having made a firm decision and being resolved not to change it.",
                sample: "She was determined to finish the marathon despite her injury."
            },
            {
                word: "ELABORATE",
                pronunciation: "ih-la-buh-rut",
                pos: "adjective/verb",
                meaning: "Involving many carefully arranged parts or details; to explain further.",
                sample: "The castle featured elaborate stone carvings along the grand entrance."
            },
            {
                word: "HYPOTHESIS",
                pronunciation: "hy-pa-thuh-sis",
                pos: "noun",
                meaning: "A supposition or proposed explanation made on the basis of limited evidence.",
                sample: "The scientist designed an experiment to test her new hypothesis."
            },
            {
                word: "MOURNFUL",
                pronunciation: "morn-fuhl",
                pos: "adjective",
                meaning: "Feeling, expressing, or inducing sadness, grief, or regret.",
                sample: "A mournful tune played softly from the old gramophone."
            },
            {
                word: "OPTIMISTIC",
                pronunciation: "aap-tuh-mis-tik",
                pos: "adjective",
                meaning: "Hopeful and confident about the future or the success of something.",
                sample: "Despite the bad weather, the coach remained optimistic about the game."
            },
            {
                word: "REASSURE",
                pronunciation: "ree-uh-shur",
                pos: "verb",
                meaning: "To say or do something to remove the doubts and fears of someone.",
                sample: "The parents rushed to reassure their frightened child after the storm."
            },
            {
                word: "SUFFICIENT",
                pronunciation: "suh-fish-uhnt",
                pos: "adjective",
                meaning: "Enough; adequate for a particular purpose.",
                sample: "Five cups of flour will be sufficient to bake the wedding cake."
            },
            {
                word: "EVALUATE",
                pronunciation: "ih-val-yoo-ayt",
                pos: "verb",
                meaning: "To form an idea of the amount, number, or value of something; assess.",
                sample: "Teachers evaluate student progress through quizzes and homework."
            },
            {
                word: "IMMATURE",
                pronunciation: "im-uh-tyur",
                pos: "adjective",
                meaning: "Not fully developed or grown; lacking emotional maturity.",
                sample: "Laughing at serious situations is a sign of immature behavior."
            },
            {
                word: "INTERJECT",
                pronunciation: "in-tur-jekt",
                pos: "verb",
                meaning: "To interrupte a remark or conversation with an abrupt comment.",
                sample: "He tried to interject a helpful suggestion during the meeting."
            },
            {
                word: "PRECISION",
                pronunciation: "pri-si-zhuhn",
                pos: "noun/adjective",
                meaning: "The quality, condition, or fact of being exact and accurate.",
                sample: "Watchmakers assemble tiny gears with incredible precision."
            },
            {
                word: "REBELLION",
                pronunciation: "ri-bel-yuhn",
                pos: "noun",
                meaning: "An act of armed resistance to an established government or ruler.",
                sample: "History books recorded the causes of the nineteenth-century rebellion."
            },
            {
                word: "REPETITION",
                pronunciation: "reh-puh-ti-shuhn",
                pos: "noun",
                meaning: "The action of repeating something that has already been said or written.",
                sample: "Repetition of vocabulary words helps students commit them to memory."
            },
            {
                word: "APPARENT",
                pronunciation: "uh-pa-runt",
                pos: "adjective",
                meaning: "Clearly visible or understood; obvious.",
                sample: "It became apparent that the project needed much more time."
            },
            {
                word: "COMMOTION",
                pronunciation: "kuh-moh-shuhn",
                pos: "noun",
                meaning: "A state of confused and noisy disturbance.",
                sample: "The sudden commotion outside drew everyone's attention to the street."
            },
            {
                word: "PREDICTION",
                pronunciation: "pri-dik-shuhn",
                pos: "noun",
                meaning: "A statement about what will happen or might happen in the future.",
                sample: "Meteorologists made an accurate prediction about the weekend snowfall."
            },
            {
                word: "PREJUDICE",
                pronunciation: "prej-uh-dis",
                pos: "noun/verb",
                meaning: "Preconceived opinion that is not based on reason or actual experience.",
                sample: "Education plays a critical role in overcoming social prejudice."
            },
            {
                word: "REPRESENT",
                pronunciation: "reh-pri-zent",
                pos: "verb",
                meaning: "To be a symbol or embody a quality or idea; to act on behalf of someone.",
                sample: "Elected officials represent the interests of their constituents."
            },
            {
                word: "SYMPATHETIC",
                pronunciation: "sim-puh-the-tik",
                pos: "adjective",
                meaning: "Arousing or showing feelings of pity and sorrow for someone else's misfortune.",
                sample: "Her friends offered sympathetic words after she lost her necklace."
            },
            {
                word: "VARIABLE",
                pronunciation: "ver-ee-uh-buhl",
                pos: "adjective/noun",
                meaning: "Not consistent or having a fixed pattern; liable to change.",
                sample: "Spring weather is notoriously variable from one day to the next."
            },
            {
                word: "ARROGANT",
                pronunciation: "ar-uh-gunt",
                pos: "adjective",
                meaning: "Having or revealing an exaggerated sense of one's own importance.",
                sample: "His arrogant attitude made it difficult for others to work with him."
            },
            {
                word: "CULTIVATE",
                pronunciation: "kul-tuh-vayt",
                pos: "verb",
                meaning: "To prepare and use land for crops; to try to acquire or develop a quality.",
                sample: "Farmers work hard to cultivate rich soil for their vegetable crops."
            },
            {
                word: "DISTINGUISH",
                pronunciation: "dis-ting-gwish",
                pos: "verb",
                meaning: "To recognize or treat someone or something as different.",
                sample: "It can be hard to distinguish between twin brothers at a distance."
            },
            {
                word: "FRUSTRATION",
                pronunciation: "fru-stray-shuhn",
                pos: "noun",
                meaning: "The feeling of being upset or annoyed as a result of being unable to change or achieve something.",
                sample: "He slammed the keyboard in frustration after losing his unsaved work."
            },
            {
                word: "INEVITABLE",
                pronunciation: "in-ev-uh-tuh-buhl",
                pos: "adjective",
                meaning: "Certain to happen; unavoidable.",
                sample: "Fatigue is the inevitable result of working a twenty-hour shift."
            },
            {
                word: "OVERWHELM",
                pronunciation: "oh-vur-hwelm",
                pos: "verb",
                meaning: "To bury or drown beneath a huge mass; to give too much of a thing to.",
                sample: "The sheer volume of paperwork threatened to overwhelm the office manager."
            },
            {
                word: "RECKLESS",
                pronunciation: "rek-lis",
                pos: "adjective",
                meaning: "Without thinking or caring about the consequences of an action.",
                sample: "Driving over the speed limit during a blizzard is deeply reckless."
            },
            {
                word: "TENTATIVE",
                pronunciation: "ten-tuh-tiv",
                pos: "adjective",
                meaning: "Not certain or fixed; provisional.",
                sample: "They made tentative plans to meet for coffee on Saturday afternoon."
            },
            {
                word: "DESPERATE",
                pronunciation: "des-puh-rut",
                pos: "adjective",
                meaning: "Feeling or showing a hopeless sense that a situation is so bad as to be impossible to deal with.",
                sample: "The stranded hikers made a desperate call for help on the radio."
            },
            {
                word: "GRIMACE",
                pronunciation: "grim-uhs",
                pos: "noun/verb",
                meaning: "An ugly, twisted expression on a person's face, typically expressing disgust or pain.",
                sample: "He let out a grimace as the nurse cleaned the deep scratch."
            },
            {
                word: "INFERIOR",
                pronunciation: "in-fir-ee-ur",
                pos: "adjective/noun",
                meaning: "Lower in rank, status, or quality.",
                sample: "Never accept inferior materials when building a house foundation."
            },
            {
                word: "PARCHED",
                pronunciation: "parcht",
                pos: "adjective",
                meaning: "Dried out with heat; extremely thirsty.",
                sample: "The stray dog drank eagerly from a puddle to soothe its parched throat."
            },
            {
                word: "PRIORITY",
                pronunciation: "pry-or-uh-tee",
                pos: "noun",
                meaning: "The fact or condition of being regarded or treated as more important than others.",
                sample: "Finishing the safety inspection is our top priority this morning."
            },
            {
                word: "RECURRING",
                pronunciation: "ri-kur-ing",
                pos: "adjective",
                meaning: "Occurring repeatedly.",
                sample: "She suffered from recurring headaches after staring at screens too long."
            },
            {
                word: "RUMMAGE",
                pronunciation: "ru-mij",
                pos: "verb/noun",
                meaning: "To search unsystematically and untidily through a mass or receptacle.",
                sample: "He began to rummage through the attic boxes for old photo albums."
            },
            {
                word: "TERRAIN",
                pronunciation: "tuh-rayn",
                pos: "noun",
                meaning: "A stretch of land, especially with regard to its physical features.",
                sample: "Mountain bikes are specially built to handle rough and rocky terrain."
            },
            {
                word: "TRANSMIT",
                pronunciation: "tranz-mit",
                pos: "verb",
                meaning: "To pass on from one person or place to another.",
                sample: "Radio towers transmit audio signals across hundreds of miles."
            },
            {
                word: "VIEWPOINT",
                pronunciation: "vyoo-poynt",
                pos: "noun",
                meaning: "A particular attitude or way of considering a matter; perspective.",
                sample: "It is helpful to listen to every viewpoint before making a final decision."
            },
            {
                word: "VISIBILITY",
                pronunciation: "viz-uh-bil-uh-tee",
                pos: "noun",
                meaning: "The state or fact of being able to see or be seen; distance one can see.",
                sample: "Thick fog dropped highway visibility down to less than fifty feet."
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
            },
            {
                word: "ACCUMULATE",
                pronunciation: "uh-kyoo-myuh-layt",
                pos: "verb",
                meaning: "To gather or collect an increasing number or quantity of something over time.",
                sample: "Dust will quickly accumulate on bookshelves if they are left uncleaned."
            },
            {
                word: "BENEFICIAL",
                pronunciation: "ben-uh-fish-uhl",
                pos: "adjective",
                meaning: "Favorable or resulting in good; advantageous.",
                sample: "Eating leafy green vegetables is highly beneficial for your health."
            },
            {
                word: "COMPLEXITY",
                pronunciation: "kum-plek-suh-tee",
                pos: "noun",
                meaning: "The state or quality of being intricate or complicated.",
                sample: "Engineers were amazed by the structural complexity of the ancient clock."
            },
            {
                word: "MISCHIEVOUS",
                pronunciation: "mis-chuh-vus",
                pos: "adjective",
                meaning: "Causing or showing a fondness for causing trouble in a playful way.",
                sample: "The puppy had a mischievous look in its eyes right before chewing the shoe."
            },
            {
                word: "PERSEVERE",
                pronunciation: "pur-suh-veer",
                pos: "verb",
                meaning: "To continue in a course of action even in the face of difficulty.",
                sample: "Inventors must persevere through multiple failures before finding success."
            },
            {
                word: "TREACHEROUS",
                pronunciation: "tre-chuh-rus",
                pos: "adjective",
                meaning: "Guilty of or involving betrayal; hazardous or dangerous due to hidden perils.",
                sample: "Black ice made driving conditions treacherous across mountain passes."
            },
            {
                word: "CONSECUTIVE",
                pronunciation: "kuhn-sek-yuh-tiv",
                pos: "adjective",
                meaning: "Following continuously; in unbroken or logical sequence.",
                sample: "The basketball team won four consecutive games in a row."
            },
            {
                word: "OPTIMISTIC",
                pronunciation: "aap-tuh-mis-tik",
                pos: "adjective",
                meaning: "Hopeful and confident about the future.",
                sample: "The investors remained optimistic about launching the new tech product."
            },
            {
                word: "SABOTAGE",
                pronunciation: "sa-buh-taazh",
                pos: "noun/verb",
                meaning: "Deliberately destroy, damage, or obstruct something, especially for political or military advantage.",
                sample: "The spy tried to sabotage the communication lines before dawn."
            },
            {
                word: "CONTEMPLATE",
                pronunciation: "kaan-tuhm-playt",
                pos: "verb",
                meaning: "To look thoughtfully for a long time at; to think profoundly.",
                sample: "She sat by the lake to contemplate her future career options."
            },
            {
                word: "DEVASTATE",
                pronunciation: "dev-uh-stayt",
                pos: "verb",
                meaning: "To destroy or ruin something completely.",
                sample: "A massive wildfire threatened to devastate the national forest."
            },
            {
                word: "REBELLION",
                pronunciation: "ri-bel-yuhn",
                pos: "noun",
                meaning: "An act of violent or open resistance to an established government or ruler.",
                sample: "Citizens joined the rebellion to fight against unfair taxation laws."
            },
            {
                word: "CHRONOLOGICAL",
                pronunciation: "kraa-nuh-laa-jih-kuhl",
                pos: "adjective",
                meaning: "Starting with the earliest and following the order in which they occurred.",
                sample: "The biography recorded every major life event in strict chronological order."
            },
            {
                word: "CONTROVERSY",
                pronunciation: "kaan-truh-vur-see",
                pos: "noun",
                meaning: "A prolonged public disagreement or heated discussion.",
                sample: "The new stadium proposal sparked widespread controversy in town."
            },
            {
                word: "FLAMMABLE",
                pronunciation: "fla-muh-buhl",
                pos: "adjective",
                meaning: "Easily set on fire.",
                sample: "Chemical containers must be clearly marked if they contain flammable liquids."
            },
            {
                word: "CIRCUMSTANCE",
                pronunciation: "sur-kum-stans",
                pos: "noun",
                meaning: "A fact or condition connected with an event or action; an-event or situation.",
                sample: "An unforeseen circumstance forced them to cancel the outdoor party."
            }
        ]
    }
};

// Expose globally on window so index.html always finds it
window.WORD_DATABASE = WORD_DATABASE;
