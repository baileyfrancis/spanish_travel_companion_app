/* Static learning content. No user progress is stored in this file. */
(function () {
  "use strict";

  const phases = [
    {
      month: 1,
      title: "Build the sound system",
      focus: "Pronunciation, greetings, identity, numbers, and high-frequency present-tense chunks.",
      studySpanishFocus: "vowels, consonants, stress, introductions, and regular present-tense verbs",
      listeningStage: 1,
      scenarioIds: ["hostel", "meeting-locals"]
    },
    {
      month: 2,
      title: "Make survival Spanish automatic",
      focus: "Core verbs, questions, prices, directions, time, and repair phrases.",
      studySpanishFocus: "questions, numbers, time, ser and estar, tener, venir, and ir",
      listeningStage: 1,
      scenarioIds: ["directions", "bus-ticket"]
    },
    {
      month: 3,
      title: "Handle food and accommodation",
      focus: "Ordering, dietary needs, booking details, check-in, and polite requests.",
      studySpanishFocus: "restaurant vocabulary, direct objects, gustar-like verbs, and polite requests",
      listeningStage: 2,
      scenarioIds: ["food", "hostel"]
    },
    {
      month: 4,
      title: "Move around confidently",
      focus: "Transport, route questions, near future, simple past events, and practical problems.",
      studySpanishFocus: "public transport vocabulary, ir a, prepositions, and the preterite",
      listeningStage: 2,
      scenarioIds: ["bus-ticket", "directions", "lost-item"]
    },
    {
      month: 5,
      title: "Activate your speaking",
      focus: "Daily self-talk, phrase mining, short conversations, and explaining minor problems.",
      studySpanishFocus: "reflexive verbs, present progressive, object pronouns, and practical problem vocabulary",
      listeningStage: 3,
      scenarioIds: ["booking-problem", "laundry", "sim-card"]
    },
    {
      month: 6,
      title: "Connect days and stories",
      focus: "Routine, recent past, sequencing, longer answers, and conversational follow-ups.",
      studySpanishFocus: "preterite and imperfect forms, sequencing expressions, and everyday routines",
      listeningStage: 3,
      scenarioIds: ["meeting-locals", "food"]
    },
    {
      month: 7,
      title: "Bridge toward A2+",
      focus: "Past tense contrast, descriptions, preferences, and sustained five-minute conversations.",
      studySpanishFocus: "preterite versus imperfect, comparisons, descriptions, and preferences",
      listeningStage: 4,
      scenarioIds: ["meeting-locals", "safety"]
    },
    {
      month: 8,
      title: "Express opinions",
      focus: "Reasons, comparisons, recommendations, uncertainty, and reacting naturally.",
      studySpanishFocus: "por and para, comparisons, the present subjunctive, and expressions of doubt",
      listeningStage: 4,
      scenarioIds: ["meeting-locals", "food", "safety"]
    },
    {
      month: 9,
      title: "Tell useful travel stories",
      focus: "Narrating journeys, mishaps, highlights, background detail, and intermediate listening.",
      studySpanishFocus: "past-tense contrast, relative pronouns, adverbs, and travel-story vocabulary",
      listeningStage: 5,
      scenarioIds: ["lost-item", "booking-problem", "border"]
    },
    {
      month: 10,
      title: "Simulate real travel",
      focus: "Health, logistics, money, safety, and complete scenario runs under light pressure.",
      studySpanishFocus: "formal commands, object pronouns with commands, health, injuries, and emergency vocabulary",
      listeningStage: 5,
      scenarioIds: ["pharmacy", "sim-card", "safety"]
    },
    {
      month: 11,
      title: "Prepare your route",
      focus: "Regional listening, country-specific vocabulary, border travel, and full-day simulations.",
      studySpanishFocus: "future and conditional forms, travel vocabulary, idioms, and cultural notes",
      listeningStage: 6,
      scenarioIds: ["border", "bus-ticket", "hostel"]
    },
    {
      month: 12,
      title: "Become travel ready",
      focus: "Fast retrieval, emergency language, weak-point repair, and final departure rehearsals.",
      studySpanishFocus: "commands, tense review, accentuation, and your weakest grammar or pronunciation topics",
      listeningStage: 6,
      scenarioIds: ["pharmacy", "border", "lost-item", "booking-problem"]
    }
  ];

  const weeklyThemes = [
    "Introductions and pronunciation",
    "Numbers, time, and spelling",
    "Core verbs and simple questions",
    "Directions and getting clarification",
    "Food, menus, and polite requests",
    "Accommodation and bookings",
    "Transport and route planning",
    "Health, body, and pharmacy",
    "Daily routine and self-talk",
    "Past experiences and sequencing",
    "Opinions, preferences, and reasons",
    "Travel stories and problem solving",
    "Route simulation and rapid retrieval"
  ];

  const dayPatterns = [
    {
      label: "Learn",
      read: "Read aloud and annotate the next Read2Speak section. Mine 3 useful chunks.",
      listen: "Complete focused listening at your current ladder stage. Replay one short section.",
      speak: "Shadow 5 sentences, then answer today’s prompt aloud.",
      review: "Review due phrases, then complete a short Linguno conjugation drill using this week’s tense.",
      travel: "Preview this week’s scenario vocabulary."
    },
    {
      label: "Build",
      read: "Rewrite 3 Read2Speak examples so they fit your own trip.",
      listen: "Use Linguno listening at your level: listen once for the gist, then again for words and phrases you recognise.",
      speak: "Give a 2-minute answer using this week’s structures.",
      review: "Complete due phrase reviews and a short Linguno word-flashcard session.",
      travel: "Practise two polite questions from the current travel theme."
    },
    {
      label: "Hear",
      read: "Reread the current dialogue aloud, focusing on rhythm rather than speed.",
      listen: "Do the week’s longest listening session, using Linguno or your listening ladder. Note 3 sounds or chunks you catch.",
      speak: "Shadow a short clip and record one uninterrupted minute.",
      review: "Review due phrases, saying every Spanish answer aloud.",
      travel: "Listen for the week’s scenario vocabulary in context."
    },
    {
      label: "Use",
      read: "Close the book and reconstruct the current dialogue from memory, then check it.",
      listen: "Watch or listen with Spanish subtitles or transcript support.",
      speak: "Roleplay both sides of a practical exchange.",
      review: "Mine 2 phrases from today’s input, then test the key verb forms in Linguno conjugation practice.",
      travel: "Complete the week’s main scenario and rate your confidence."
    },
    {
      label: "Connect",
      read: "Review this week’s Read2Speak pages and mark anything still slow to retrieve.",
      listen: "Choose enjoyable input at or just below your current level.",
      speak: "Speak for 3-5 minutes, connecting ideas with porque, pero, entonces, and después.",
      review: "Clear due reviews, practise useful travel words in Linguno flashcards, and star the 3 most useful phrases.",
      travel: "Personalise the scenario with a destination, price, time, or need from your trip."
    },
    {
      label: "Explore",
      read: "Light Read2Speak catch-up or phrase mining. Stop after one useful page.",
      listen: "Explore a free Spanish resource and choose content you genuinely want to finish.",
      speak: "Give a relaxed travel update or describe your likely route.",
      review: "Do a quick phrase review; add no more than 3 new cards.",
      travel: "Solve a Linguno crossword at your level, choosing a travel theme when available."
    },
    {
      label: "Check in",
      read: "Review the week’s mined phrases and choose what deserves another week.",
      listen: "Replay an earlier clip and notice what is easier now.",
      speak: "Complete the weekly diagnostic aloud without notes.",
      review: "Clear reviews, then pause new cards if the due pile feels heavy.",
      travel: "Rate the week’s scenario and write one next step."
    }
  ];

  function addStudySpanishGuidance(dayOfWeek, taskType, detail, phase) {
    const focus = phase.studySpanishFocus;
    const guidance = [
      ["read", `Before drilling, read one relevant StudySpanish grammar lesson. Current focus: ${focus}.`],
      ["review", `Use a StudySpanish vocabulary topic related to the week, retaining only words useful for travel. Current focus: ${focus}.`],
      ["listen", `Begin with one short StudySpanish pronunciation listen-and-repeat lesson, speaking at normal volume. Current focus: ${focus}.`],
      ["review", `Take the StudySpanish quiz for a relevant grammar lesson, then use the corrected structure aloud. Current focus: ${focus}.`],
      ["review", `Complete a matching StudySpanish verb drill before adaptive Linguno practice. Current focus: ${focus}.`],
      ["travel", `Explore the StudySpanish Travel Helper, cultural notes, or idioms for the current scenario. Current focus: ${focus}.`],
      ["read", `Revisit one weak StudySpanish grammar or pronunciation topic uncovered this week. Current focus: ${focus}.`]
    ][dayOfWeek];

    return guidance[0] === taskType ? `${detail} ${guidance[1]}` : detail;
  }

  const weeklyCheckIns = [
    "What can you now say without translating first?",
    "Which sound or listening pattern still slows you down?",
    "Which five phrases would be most useful tomorrow in Latin America?",
    "Can you ask a follow-up question instead of ending the conversation?",
    "What did you avoid this week, and what is the smallest way to practise it?",
    "Which study activity produced the clearest real-world improvement?",
    "Can you explain one simple problem and ask for a solution?",
    "What should next week contain less of, and more of?"
  ];

  const milestones = [
    "Introduce yourself for 90 seconds: background, interests, and travel plan.",
    "Ask basic directions and prices, then confirm what you understood.",
    "Order a meal and complete an accommodation check-in roleplay.",
    "Buy a bus ticket and describe simple plans for tomorrow.",
    "Explain a minor booking, laundry, or SIM-card problem and request help.",
    "Describe your routine and tell what you did yesterday.",
    "Hold a five-minute simple conversation with follow-up questions.",
    "Explain opinions and preferences, giving at least three reasons.",
    "Tell a travel story with sequence, background, and a reaction.",
    "Handle a pharmacy or health scenario and clarify dosage or advice.",
    "Complete a full travel-day simulation from checkout to arrival.",
    "Complete a final Latin America readiness simulation without notes."
  ].map((task, index) => ({ month: index + 1, task }));

  const phrasebook = [
    ["¿Me puede ayudar?", "Can you help me?", "Essentials"],
    ["No entendí. ¿Puede repetirlo más despacio?", "I didn’t understand. Can you repeat it more slowly?", "Repair"],
    ["¿Cómo se dice esto en español?", "How do you say this in Spanish?", "Repair"],
    ["Estoy aprendiendo español.", "I’m learning Spanish.", "Essentials"],
    ["¿Cuánto cuesta?", "How much does it cost?", "Money"],
    ["¿Aceptan tarjeta?", "Do you accept card?", "Money"],
    ["¿Dónde hay un cajero automático?", "Where is there an ATM?", "Money"],
    ["Quisiera reservar una habitación.", "I’d like to book a room.", "Accommodation"],
    ["Tengo una reserva a nombre de…", "I have a reservation under the name…", "Accommodation"],
    ["¿A qué hora es la salida?", "What time is checkout?", "Accommodation"],
    ["Quisiera pedir…", "I’d like to order…", "Food"],
    ["Sin picante, por favor.", "Not spicy, please.", "Food"],
    ["Soy alérgico/a a…", "I’m allergic to…", "Food"],
    ["La cuenta, por favor.", "The bill, please.", "Food"],
    ["¿De dónde sale el autobús?", "Where does the bus leave from?", "Transport"],
    ["Un billete para…, por favor.", "One ticket to…, please.", "Transport"],
    ["¿Es directo o hay que cambiar?", "Is it direct or do I need to change?", "Transport"],
    ["¿Cuánto tarda?", "How long does it take?", "Transport"],
    ["¿Cómo llego a…?", "How do I get to…?", "Directions"],
    ["¿Está lejos de aquí?", "Is it far from here?", "Directions"],
    ["¿Puede mostrármelo en el mapa?", "Can you show me on the map?", "Directions"],
    ["Necesito una farmacia.", "I need a pharmacy.", "Health"],
    ["Me duele aquí.", "It hurts here.", "Health"],
    ["Tengo fiebre desde ayer.", "I’ve had a fever since yesterday.", "Health"],
    ["¿Cada cuántas horas?", "How often / every how many hours?", "Health"],
    ["Necesito una tarjeta SIM con datos.", "I need a SIM card with data.", "Connectivity"],
    ["¿Puede activarla por mí?", "Can you activate it for me?", "Connectivity"],
    ["¿Dónde puedo lavar la ropa?", "Where can I wash clothes?", "Laundry"],
    ["¿Cuándo estará lista?", "When will it be ready?", "Laundry"],
    ["Estoy viajando por seis meses.", "I’m travelling for six months.", "Conversation"],
    ["¿Qué lugar me recomienda?", "What place do you recommend?", "Conversation"],
    ["¿Es seguro caminar por aquí de noche?", "Is it safe to walk around here at night?", "Safety"],
    ["¿Hay alguna zona que deba evitar?", "Is there an area I should avoid?", "Safety"],
    ["He perdido mi…", "I’ve lost my…", "Problems"],
    ["Hay un problema con mi reserva.", "There is a problem with my booking.", "Problems"],
    ["¿Dónde está migración?", "Where is immigration?", "Border"],
    ["Estoy aquí por turismo.", "I’m here for tourism.", "Border"],
    ["Voy a quedarme durante…", "I’m going to stay for…", "Border"],
    ["Necesito llamar a emergencias.", "I need to call emergency services.", "Emergency"],
    ["Por favor, escriba la dirección.", "Please write down the address.", "Emergency"]
  ].map((row, index) => ({
    id: `phrasebook-${index + 1}`,
    spanish: row[0],
    english: row[1],
    category: row[2],
    source: "phrasebook"
  }));

  const starterDeckIds = [
    "phrasebook-1", "phrasebook-2", "phrasebook-5", "phrasebook-8",
    "phrasebook-11", "phrasebook-15", "phrasebook-19", "phrasebook-22",
    "phrasebook-30", "phrasebook-32", "phrasebook-35", "phrasebook-37"
  ];

  const speakingPrompts = [
    "Introduce yourself and explain why you are learning Spanish.",
    "Describe your day from waking up to going to bed.",
    "Explain tomorrow’s plan using voy a.",
    "Order a meal and ask two questions about the menu.",
    "Ask for directions, then repeat the route back to confirm it.",
    "Explain a problem with an accommodation booking.",
    "Describe symptoms and ask for advice at a pharmacy.",
    "Talk through your likely six-month travel route.",
    "Describe where you live and compare it with a place you want to visit.",
    "Tell the story of a journey that went well or badly.",
    "Explain what kind of food, weather, and activities you prefer.",
    "Ask a local for recommendations and respond with follow-up questions.",
    "Explain that you lost an important item and describe it.",
    "Describe what you did yesterday in chronological order.",
    "Talk about a challenge you expect while travelling and how you will handle it.",
    "Give a two-minute summary of something you watched in Spanish.",
    "Roleplay meeting another traveller and making a plan together.",
    "Explain your dietary needs or allergies clearly.",
    "Compare two countries or cities on your route.",
    "Talk yourself through a complete travel day."
  ];

  const scenarios = [
    {
      id: "hostel",
      title: "Hostel check-in",
      category: "Accommodation",
      situation: "You arrive tired, confirm your booking, ask about breakfast and checkout, and solve one missing detail.",
      vocabulary: ["reserva", "habitación", "cama", "llave", "salida"],
      phrases: ["Tengo una reserva a nombre de…", "¿Está incluido el desayuno?", "¿A qué hora es la salida?"],
      roleplay: "You are the guest. The receptionist cannot initially find your reservation."
    },
    {
      id: "bus-ticket",
      title: "Buying a bus ticket",
      category: "Transport",
      situation: "Buy a ticket for your next destination and clarify departure point, journey time, and connections.",
      vocabulary: ["boleto / billete", "terminal", "andén", "directo", "ida"],
      phrases: ["Un boleto para…, por favor.", "¿De dónde sale?", "¿Es directo?"],
      roleplay: "The direct bus is full. Ask about the best alternative."
    },
    {
      id: "food",
      title: "Ordering food",
      category: "Food",
      situation: "Ask about a dish, order politely, explain a dietary need, and request the bill.",
      vocabulary: ["menú", "plato", "ingredientes", "sin", "cuenta"],
      phrases: ["¿Qué lleva este plato?", "Quisiera pedir…", "La cuenta, por favor."],
      roleplay: "One ingredient is unavailable. Ask for a suitable alternative."
    },
    {
      id: "directions",
      title: "Asking for directions",
      category: "Directions",
      situation: "Find a bus terminal and confirm whether you can walk there safely.",
      vocabulary: ["derecho", "esquina", "cuadra", "girar", "cerca"],
      phrases: ["¿Cómo llego a…?", "¿Está lejos?", "Entonces, sigo derecho y…"],
      roleplay: "The first explanation is too fast. Ask for repetition and confirm each step."
    },
    {
      id: "pharmacy",
      title: "Pharmacy and health",
      category: "Health",
      situation: "Describe a minor symptom, say how long it has lasted, and understand basic medicine instructions.",
      vocabulary: ["dolor", "fiebre", "pastilla", "dosis", "receta"],
      phrases: ["Me duele…", "Desde hace dos días.", "¿Cada cuántas horas?"],
      roleplay: "The pharmacist asks about allergies and other medication."
    },
    {
      id: "sim-card",
      title: "SIM card setup",
      category: "Connectivity",
      situation: "Buy a prepaid SIM, choose a data package, and make sure it is activated.",
      vocabulary: ["chip / tarjeta SIM", "datos", "prepago", "recarga", "señal"],
      phrases: ["Necesito una SIM con datos.", "¿Cuántos gigas incluye?", "¿Puede activarla?"],
      roleplay: "Your phone does not connect after installation. Explain what you see."
    },
    {
      id: "laundry",
      title: "Laundry",
      category: "Daily life",
      situation: "Ask for a wash service, clarify price and collection time, and mention one delicate item.",
      vocabulary: ["lavar", "secar", "kilo", "delicado", "listo"],
      phrases: ["Quisiera lavar esta ropa.", "¿Cuánto cuesta por kilo?", "¿Cuándo estará lista?"],
      roleplay: "You need the clothes before an early departure tomorrow."
    },
    {
      id: "border",
      title: "Border crossing",
      category: "Border",
      situation: "Answer routine immigration questions about purpose, length of stay, route, and accommodation.",
      vocabulary: ["turismo", "estadía", "salida", "alojamiento", "pasaporte"],
      phrases: ["Estoy aquí por turismo.", "Voy a quedarme…", "Después voy a viajar a…"],
      roleplay: "The officer asks for proof of onward travel and your first address."
    },
    {
      id: "safety",
      title: "Asking about safety",
      category: "Safety",
      situation: "Ask trusted local staff about transport, neighbourhoods, and walking after dark.",
      vocabulary: ["seguro", "evitar", "barrio", "de noche", "taxi"],
      phrases: ["¿Es seguro caminar por aquí?", "¿Qué zona debo evitar?", "¿Cuál es la opción más segura?"],
      roleplay: "Your original route is not recommended. Ask for a practical alternative."
    },
    {
      id: "meeting-locals",
      title: "Meeting locals",
      category: "Conversation",
      situation: "Introduce yourself, explain your trip, ask for recommendations, and keep the exchange moving.",
      vocabulary: ["viaje", "ruta", "recomendar", "conocer", "quedarse"],
      phrases: ["Estoy viajando por…", "¿Qué me recomienda?", "¿Y usted / tú?"],
      roleplay: "You meet someone at a café who is curious about your route."
    },
    {
      id: "booking-problem",
      title: "Booking problem",
      category: "Problems",
      situation: "Your booking details do not match what you paid for. Explain calmly and request a solution.",
      vocabulary: ["confirmación", "pago", "cancelado", "disponible", "solución"],
      phrases: ["Hay un problema con mi reserva.", "Aquí está la confirmación.", "¿Qué solución hay?"],
      roleplay: "The room or ticket type you booked is unavailable."
    },
    {
      id: "lost-item",
      title: "Lost item",
      category: "Problems",
      situation: "Report a lost phone, bag, or document and explain where you last had it.",
      vocabulary: ["perder", "mochila", "documento", "última vez", "encontrar"],
      phrases: ["He perdido mi…", "La última vez que lo vi fue…", "¿Hay objetos perdidos?"],
      roleplay: "Staff ask you to describe the item and reconstruct your route."
    }
  ];

  const listeningLadder = [
    {
      stage: 1,
      title: "Superbeginner comprehensible input",
      goal: "Follow meaning through visuals, gesture, repetition, and familiar topics.",
      content: "Dreaming Spanish superbeginner videos; Spanish After Hours beginner visual stories",
      minutes: 60,
      links: [
        ["Dreaming Spanish superbeginner", "https://www.youtube.com/results?search_query=Dreaming+Spanish+superbeginner"],
        ["Spanish After Hours beginner", "https://www.youtube.com/results?search_query=Spanish+After+Hours+beginner"]
      ],
      moveUp: "Move up when you understand the overall story in most videos without translating line by line."
    },
    {
      stage: 2,
      title: "Beginner stories",
      goal: "Follow short narratives and recognise common present and past chunks.",
      content: "Beginner Spanish stories, graded listening, and familiar-topic comprehensible input",
      minutes: 90,
      links: [
        ["Beginner Spanish stories", "https://www.youtube.com/results?search_query=beginner+Spanish+comprehensible+input+stories"],
        ["Dreaming Spanish beginner", "https://www.youtube.com/results?search_query=Dreaming+Spanish+beginner"]
      ],
      moveUp: "Move up when 10-minute beginner stories feel comfortable and you can summarise the gist."
    },
    {
      stage: 3,
      title: "Slow learner podcasts",
      goal: "Build listening stamina without depending on visual clues.",
      content: "Slow Spanish podcasts and learner-friendly Latin American conversations",
      minutes: 120,
      links: [
        ["Slow Spanish podcast", "https://www.youtube.com/results?search_query=slow+Spanish+podcast+Latin+American"],
        ["Español con Juan", "https://www.youtube.com/results?search_query=Espa%C3%B1ol+con+Juan+podcast"]
      ],
      moveUp: "Move up when you can follow 15 minutes while walking and recall the main points."
    },
    {
      stage: 4,
      title: "Easy Spanish street interviews",
      goal: "Adjust to multiple speakers, natural replies, and everyday accents.",
      content: "Easy Spanish street interviews with Spanish subtitles",
      minutes: 150,
      links: [
        ["Easy Spanish interviews", "https://www.youtube.com/results?search_query=Easy+Spanish+street+interviews+Latin+America"]
      ],
      moveUp: "Move up when subtitles support rather than rescue your understanding."
    },
    {
      stage: 5,
      title: "Travel vlogs with subtitles",
      goal: "Learn route vocabulary and follow unscripted travel situations.",
      content: "Latin America travel vlogs with Spanish subtitles",
      minutes: 180,
      links: [
        ["Latin America travel vlogs", "https://www.youtube.com/results?search_query=viaje+por+Latinoam%C3%A9rica+vlog+subt%C3%ADtulos"]
      ],
      moveUp: "Move up when you can follow a full vlog and mine useful phrases without pausing constantly."
    },
    {
      stage: 6,
      title: "Native Latin American content",
      goal: "Tolerate speed and ambiguity while following topics you care about.",
      content: "Native podcasts, local news explainers, interviews, and regional creators",
      minutes: 210,
      links: [
        ["Latin American podcasts", "https://www.youtube.com/results?search_query=podcast+latinoamericano+viajes"],
        ["Latin American interviews", "https://www.youtube.com/results?search_query=entrevistas+latinoam%C3%A9rica+espa%C3%B1ol"]
      ],
      moveUp: "Stay here: broaden accents and topics, while revisiting easier content when energy is low."
    }
  ];

  const regionalNotes = {
    Mexico: {
      words: ["camión can mean bus", "ahorita is flexible: now, soon, or later", "¿mande? is a polite what/pardon?"],
      warning: "You will hear strong regional variation, but clear neutral Spanish travels well.",
      phrases: ["¿Dónde pasa el camión?", "¿Mande? No escuché bien."],
      advice: "Practise bus directions and food ordering; clarify spice level rather than assuming."
    },
    Guatemala: {
      words: ["camioneta often means bus", "pisto can mean money", "ahorita is common"],
      warning: "Highland accents may differ and some communities use Indigenous languages alongside Spanish.",
      phrases: ["¿Dónde sale la camioneta para…?", "¿Se puede pagar en efectivo?"],
      advice: "Practise shuttle, market, and volcano-tour questions with clear times and pickup points."
    },
    Colombia: {
      words: ["plata means money", "parce is slang for friend", "tinto usually means black coffee"],
      warning: "Polite phrasing is frequent; usted is widely used, even in friendly settings.",
      phrases: ["¿Me regala un tinto, por favor?", "Qué pena, ¿me puede ayudar?"],
      advice: "Lean into polite requests and practise understanding addresses and transport directions."
    },
    Peru: {
      words: ["carro may mean car", "terminal terrestre means bus terminal", "jato is slang for home"],
      warning: "Coastal and Andean speech differ; altitude can make speaking feel physically harder.",
      phrases: ["¿Dónde queda el terminal terrestre?", "Me siento mal por la altura."],
      advice: "Prioritise altitude symptoms, long-distance bus logistics, and tour pickup details."
    },
    Bolivia: {
      words: ["flota can mean long-distance bus", "casera/caserita is common in markets", "boleto is widely understood"],
      warning: "Andean varieties may have unfamiliar rhythm and vocabulary.",
      phrases: ["¿A qué hora sale la flota?", "Creo que me afecta la altura."],
      advice: "Practise terminal, altitude, border, cash, and overnight-bus scenarios."
    },
    Argentina: {
      words: ["vos replaces tú", "che gets attention", "colectivo means city bus"],
      warning: "ll and y often sound like sh or zh; vos verb forms differ: tenés, podés, querés.",
      phrases: ["¿Dónde para el colectivo?", "¿Me decís cómo llegar?"],
      advice: "Recognise voseo without needing to produce it perfectly. Practise cafés, buses, and cash/payment."
    },
    Chile: {
      words: ["micro means city bus", "pololo/a means partner", "al tiro means right away"],
      warning: "Speech can be fast, with dropped sounds and dense slang. Keep producing neutral Spanish.",
      phrases: ["¿Dónde pasa la micro?", "Más despacio, por favor. Todavía estoy aprendiendo."],
      advice: "Train listening tolerance and repair phrases; do not chase every slang term."
    },
    Uruguay: {
      words: ["ómnibus means bus", "vos is standard", "ta can mean okay/right"],
      warning: "Voseo and River Plate pronunciation are common, similar to Argentina.",
      phrases: ["¿Dónde tomo el ómnibus?", "¿Me decís cuánto demora?"],
      advice: "Practise transport and recognising voseo forms."
    },
    Ecuador: {
      words: ["bus or colectivo for transport", "plata means money", "chévere means great"],
      warning: "Highland and coastal accents differ; polite diminutives are common.",
      phrases: ["¿Dónde sale el bus para…?", "¿Cuánto cuesta la carrera?"],
      advice: "Practise altitude, buses, taxis, and asking exact prices before travel."
    },
    "Costa Rica": {
      words: ["pura vida is greeting/thanks/all good", "bus is common", "mae is informal slang"],
      warning: "Usted is common and does not necessarily sound distant.",
      phrases: ["Pura vida, muchas gracias.", "¿Dónde se toma el bus para…?"],
      advice: "Practise bus schedules, weather changes, and activity bookings."
    },
    Nicaragua: {
      words: ["bus or microbús", "tuani means cool", "vos is common"],
      warning: "Voseo is common; final s may be softened or dropped in some speech.",
      phrases: ["¿A qué hora pasa el bus?", "¿Me podés ayudar?"],
      advice: "Recognise voseo and practise local bus and shared-transport questions."
    },
    Panama: {
      words: ["bus or metrobus", "plata means money", "xopa is very informal slang"],
      warning: "Caribbean influence can make speech rapid with softened consonants.",
      phrases: ["¿Dónde recargo la tarjeta?", "¿Este bus va hacia…?"],
      advice: "Practise city transport, humidity/health needs, and border logistics."
    }
  };

  const finalPrep = [
    ["airport", "Airport Spanish", "Check-in, baggage, gates, delays, and connections"],
    ["border", "Immigration and border questions", "Purpose, duration, route, accommodation, and onward travel"],
    ["accommodation", "Accommodation", "Reservation, check-in, facilities, payment, and problems"],
    ["food", "Food and dietary needs", "Ordering, ingredients, allergies, water, and payment"],
    ["health", "Pharmacy and health", "Symptoms, duration, allergies, dosage, and urgent help"],
    ["sim", "SIM card", "Data package, activation, top-up, and troubleshooting"],
    ["transport", "Transport", "Tickets, terminals, platforms, changes, duration, and arrival"],
    ["money", "Money and cash machines", "Card acceptance, fees, exchange, cash, and broken machines"],
    ["safety", "Safety questions", "Safe routes, areas to avoid, trusted transport, and night travel"],
    ["emergency", "Emergency phrases", "Police, ambulance, lost documents, and contacting accommodation"],
    ["offline", "Offline phrase export", "Export your deck and keep key information available without signal"]
  ].map((row) => ({ id: row[0], title: row[1], detail: row[2] }));

  const achievements = [
    ["first-day", "First step", "Complete your first study day.", "1"],
    ["three-day", "Momentum", "Reach a 3-day streak.", "3"],
    ["seven-day", "One solid week", "Reach a 7-day streak.", "7"],
    ["thirty-days", "Habit built", "Complete 30 study days.", "30"],
    ["first-hour", "First hour", "Log one total study hour.", "60"],
    ["ten-hours", "Ten-hour traveller", "Log ten total study hours.", "10h"],
    ["speaker", "Voice on", "Log your first speaking practice.", "S"],
    ["speaking-60", "Conversation fuel", "Log 60 speaking minutes.", "60"],
    ["review-50", "Phrase collector", "Complete 50 phrase reviews.", "50"],
    ["master-10", "Ready phrases", "Master 10 phrases.", "10"],
    ["scenario-3", "Road tested", "Complete 3 travel scenarios.", "3"],
    ["scenario-confidence", "Calm under pressure", "Reach average scenario confidence 4.", "4"],
    ["milestone-1", "Milestone maker", "Pass your first monthly milestone.", "M"],
    ["route-ready", "Route aware", "Select at least 3 route countries.", "R"]
  ].map((row) => ({ id: row[0], title: row[1], description: row[2], mark: row[3] }));

  const resources = [
    ["Language Transfer", "Free audio course for understanding how Spanish works. Pause and answer aloud.", "https://www.languagetransfer.org/complete-spanish"],
    ["Duolingo", "Use lightly for daily vocabulary maintenance, not as the whole plan.", "https://www.duolingo.com/course/es/en/Learn-Spanish"],
    ["Dreaming Spanish", "Levelled comprehensible input from superbeginner upward.", "https://www.dreamingspanish.com/"],
    ["Easy Spanish", "Street interviews and learner-focused conversations with subtitles.", "https://www.youtube.com/@EasySpanish"],
    ["Spanish After Hours", "Clear, visual comprehensible input and stories.", "https://www.youtube.com/@spanishafterhours"],
    ["Butterfly Spanish", "Practical explanations of grammar and travel language.", "https://www.youtube.com/@ButterflySpanish"],
    ["Español con Juan", "Engaging intermediate listening and explanations entirely in Spanish.", "https://www.youtube.com/@espanolconjuan"],
    ["Read2Speak workflow", "Read aloud, mine five useful phrases, rewrite three for your route, then recall the dialogue without looking.", ""]
  ].map((row) => ({ title: row[0], description: row[1], url: row[2] }));

  resources.splice(1, 0, {
    title: "Linguno",
    description: "Adaptive Spanish practice for conjugation in context, listening, word flashcards, and daily crosswords. Use the short sessions named in the weekly plan.",
    url: "https://www.linguno.com/language/esp/",
    links: [
      ["Overview", "https://www.linguno.com/language/esp/"],
      ["Conjugation", "https://www.linguno.com/practice/conjugations/drills/?lang=esp"],
      ["Listening", "https://www.linguno.com/practice/listening/demo/?lang=esp"],
      ["Word flashcards", "https://www.linguno.com/practice/words/demo/?lang=esp"],
      ["Crosswords", "https://www.linguno.com/crosswords/?lang=esp"]
    ]
  });

  resources.splice(2, 0, {
    title: "StudySpanish",
    description: "Structured explanations and practice for pronunciation, grammar, vocabulary, verbs, and practical travel Spanish. Some expanded activities and progress tracking may require membership.",
    url: "https://studyspanish.com/",
    links: [
      ["Overview", "https://studyspanish.com/"],
      ["Pronunciation", "https://studyspanish.com/pronunciation"],
      ["Grammar", "https://studyspanish.com/grammar"],
      ["Vocabulary", "https://studyspanish.com/vocab"],
      ["Verb drills", "https://studyspanish.com/verbs"],
      ["Travel Helper", "https://studyspanish.com/travel-helper"]
    ]
  });

  const languageTransferCourse = {
    title: "Complete Spanish",
    lessonCount: 90,
    url: "https://www.languagetransfer.org/complete-spanish",
    lessons: Array.from({ length: 90 }, (_, index) => ({
      number: index + 1,
      title: `Lesson ${index + 1}`
    })),
    ranges: [
      { start: 1, end: 30 },
      { start: 31, end: 60 },
      { start: 61, end: 90 }
    ]
  };

  const read2SpeakCheckpoints = [
    ["ebook-introduction", "Study the eBook introduction", "Read what the unit teaches and note the communication goal.", "ebook"],
    ["ebook-grammar", "Study the eBook explanation", "Work through the main explanation slowly and write down anything unclear.", "ebook"],
    ["ebook-vocabulary", "Study vocabulary and structures", "Say useful items aloud and mark the ones you want to retrieve while travelling.", "ebook"],
    ["ebook-examples", "Read examples aloud", "Notice the pattern in context instead of memorising an isolated rule.", "ebook"],
    ["ebook-dialogue", "Read the dialogue or text aloud", "Read for meaning, then repeat for rhythm and speaking activation.", "ebook"],
    ["ebook-practice", "Complete the eBook practice", "Attempt the unit’s eBook practice before moving to the separate workbook.", "ebook"],
    ["ebook-review", "Check the eBook answers and conclusion", "Correct your work, review the key takeaways, and carry useful items into the workbook.", "ebook"],
    ["workbook-1-8", "Complete workbook exercises 1–8", "Start with the most guided practice and write your answers out.", "workbook"],
    ["workbook-9-16", "Complete workbook exercises 9–16", "Continue in order without checking the answer key early.", "workbook"],
    ["workbook-17-25", "Complete workbook exercises 17–25", "Finish the more independent production and conversation work.", "workbook"],
    ["workbook-answers", "Check the workbook answer key", "Correct each mistake and note why the corrected form works.", "workbook"],
    ["review-retry", "Review and retry weak work", "Return to the relevant eBook section, then retry difficult workbook items.", "review"],
    ["speaking-activation", "Activate the unit aloud", "Give a short original response using the unit’s broad communication skill.", "speak"],
    ["unit-review", "Complete the unit review", "Rate your confidence and schedule a return visit if retrieval is still slow.", "review"]
  ].map((row) => ({ id: row[0], title: row[1], detail: row[2], resource: row[3] }));

  function buildRead2SpeakUnits(titles, workbookStarts, ebookStarts, workbookPages, ebookPages, mismatches = {}) {
    return titles.map((title, index) => ({
      number: index + 1,
      title,
      workbook: {
        startPage: workbookStarts[index],
        endPage: (workbookStarts[index + 1] || workbookPages + 1) - 1
      },
      ebook: {
        startPage: ebookStarts[index],
        endPage: (ebookStarts[index + 1] || ebookPages + 1) - 1
      },
      alignment: mismatches[index + 1] || ""
    }));
  }

  const read2SpeakCourses = [
    {
      id: "foundations",
      level: "A1–A2",
      title: "Foundations",
      workbookFileHint: "Foundations Read2Speak Workbook",
      ebookFileHint: "Foundations Read2Speak eBook",
      units: buildRead2SpeakUnits(
        [
          "Introducing Yourself",
          "Describing People and Things",
          "Daily Routines",
          "Asking Questions (the Natural Way)",
          "Talking About Location and How You Feel",
          "Likes and Preferences",
          "Talking About Now",
          "Talking About the Recent Past",
          "Talking About Finished Past Actions",
          "Describing Past Background and Habits",
          "Future Plans Made Simple",
          "Shopping and Ordering Food",
          "Giving Instructions and Advice",
          "Speaking More Naturally with Pronouns",
          "Spanish A2 in Real Life"
        ],
        [7, 38, 70, 101, 133, 166, 197, 227, 259, 290, 322, 353, 386, 420, 452],
        [18, 56, 94, 134, 168, 207, 246, 285, 322, 364, 404, 442, 488, 536, 572],
        491,
        653
      )
    },
    {
      id: "breakthrough",
      level: "B1–B2",
      title: "Breakthrough",
      workbookFileHint: "Breakthrough Read2Speak Workbook",
      ebookFileHint: "Breakthrough Read2Speak eBook",
      units: buildRead2SpeakUnits(
        [
          "Talking About Dreams and Goals",
          "Telling Stories That Don’t Sound Flat",
          "Giving Opinions Without Sounding Too Direct",
          "Explaining Reasons and Consequences",
          "Solving Problems in Real Life",
          "Talking About Relationships and Personality",
          "Talking About Experiences and Life Lessons",
          "Giving Advice and Setting Boundaries",
          "The Spanish You Need for Travel Emergencies",
          "Talking About Work and Professional Life",
          "Comparing Ideas and Making Decisions",
          "Talking About News, Society, and Trends",
          "What People Say vs. What They Really Mean",
          "Handling Conflict and Expressing Strong Emotions",
          "Real Conversations — Bringing It All Together"
        ],
        [7, 44, 82, 120, 156, 197, 234, 274, 313, 353, 393, 433, 472, 510, 548],
        [18, 64, 120, 174, 229, 294, 350, 401, 451, 503, 557, 609, 660, 713, 763],
        583,
        857,
        {
          14: "This workbook unit covers conflict and strong emotions, while the supplied eBook Unit 14 covers hypotheses. Use both as separate complementary topics rather than assuming a direct match.",
          15: "The supplied books share a real-conversation goal, but their unit wording and exercise sequence differ. Follow the workbook order and use the eBook for supporting study."
        }
      )
    },
    {
      id: "mastery",
      level: "C1–C2",
      title: "Mastery",
      workbookFileHint: "Mastery Read2Speak Workbook",
      ebookFileHint: "Mastery Read2Speak eBook",
      units: buildRead2SpeakUnits(
        [
          "Eliminating Advanced Mistakes That Give You Away",
          "Saying the Same Thing, but with Intention",
          "Speaking Precisely Without Overexplaining",
          "Full Control of Verb Tenses",
          "Subjunctive as a Tool, Not a Problem",
          "Complex Hypotheses and What If Scenarios",
          "Sounding Natural in Long Conversations",
          "Register, Tone, and Context",
          "Arguing, Debating, and Defending Ideas",
          "Practical Mastery — Professional Writing",
          "Cultural and Pragmatic Fluency",
          "Advanced Vocabulary — Nuance and Precision",
          "Error Analysis — Native-Like Self-Correction",
          "Stylistic Flexibility — Adapting Your Voice",
          "The Final Polish — From Fluent to Flawless"
        ],
        [7, 44, 82, 118, 157, 192, 225, 261, 299, 339, 379, 420, 459, 491, 527],
        [20, 52, 91, 129, 167, 209, 244, 283, 319, 356, 388, 418, 450, 479, 508],
        560,
        567,
        {
          10: "The supplied workbook switches to professional writing here, while the eBook Unit 10 covers emphasis, irony, and implicit meaning.",
          11: "The supplied workbook covers cultural and pragmatic fluency, while the eBook Unit 11 covers vocabulary and natural collocations.",
          12: "The supplied workbook focuses on vocabulary nuance, while the eBook Unit 12 focuses on abstract and complex topics.",
          13: "The supplied workbook focuses on error analysis, while the eBook Unit 13 focuses on storytelling.",
          14: "The supplied workbook focuses on stylistic flexibility, while the eBook Unit 14 focuses on confidence and authority.",
          15: "The supplied workbook focuses on final linguistic polish, while the eBook Unit 15 integrates C1–C2 Spanish in real life."
        }
      )
    }
  ];

  function buildDailyTasks() {
    return Array.from({ length: 364 }, (_, index) => {
      const day = index + 1;
      const week = Math.floor(index / 7) + 1;
      const dayOfWeek = index % 7;
      const month = Math.min(12, Math.floor(index / (364 / 12)) + 1);
      const phase = phases[month - 1];
      const pattern = dayPatterns[dayOfWeek];
      const theme = weeklyThemes[Math.floor((week - 1) / 4) % weeklyThemes.length];
      const isCheckIn = dayOfWeek === 6;
      const isMilestone = day === Math.min(364, Math.round(month * (364 / 12)));
      const targetMinutes = [35, 40, 45, 45, 50, 35, 30][dayOfWeek] + Math.min(15, Math.floor((month - 1) / 3) * 5);

      return {
        id: `day-${day}`,
        day,
        week,
        month,
        label: pattern.label,
        title: isMilestone
          ? `Month ${month} milestone: ${milestones[month - 1].task}`
          : `${theme}: ${pattern.label.toLowerCase()} day`,
        targetMinutes,
        phaseTitle: phase.title,
        subtasks: [
          {
            id: "read",
            type: "read",
            title: "Read2Speak / StudySpanish",
            detail: addStudySpanishGuidance(dayOfWeek, "read", pattern.read, phase),
            minutes: Math.round(targetMinutes * 0.28)
          },
          {
            id: "listen",
            type: "listen",
            title: "Listening",
            detail: addStudySpanishGuidance(dayOfWeek, "listen", `Stage ${phase.listeningStage}: ${pattern.listen}`, phase),
            minutes: Math.round(targetMinutes * 0.25)
          },
          {
            id: "speak",
            type: "speak",
            title: "Speaking",
            detail: pattern.speak,
            minutes: Math.round(targetMinutes * 0.2)
          },
          {
            id: "review",
            type: "review",
            title: "Vocab, grammar and phrase review",
            detail: addStudySpanishGuidance(dayOfWeek, "review", pattern.review, phase),
            minutes: Math.round(targetMinutes * 0.15)
          },
          {
            id: "travel",
            type: "travel",
            title: isCheckIn ? "Weekly diagnostic" : (isMilestone ? "Monthly milestone" : "Travel practice"),
            detail: addStudySpanishGuidance(dayOfWeek, "travel", isCheckIn
              ? weeklyCheckIns[(week - 1) % weeklyCheckIns.length]
              : (isMilestone ? milestones[month - 1].task : pattern.travel), phase),
            minutes: Math.max(5, Math.round(targetMinutes * 0.12))
          }
        ],
        checkIn: isCheckIn ? weeklyCheckIns[(week - 1) % weeklyCheckIns.length] : "",
        milestone: isMilestone ? milestones[month - 1] : null,
        scenarioIds: phase.scenarioIds,
        listeningStage: phase.listeningStage
      };
    });
  }

  window.APP_DATA = {
    phases,
    dailyTasks: buildDailyTasks(),
    weeklyCheckIns,
    milestones,
    phrasebook,
    starterDeckIds,
    speakingPrompts,
    scenarios,
    listeningLadder,
    regionalNotes,
    finalPrep,
    achievements,
    resources,
    languageTransferCourse,
    read2SpeakCourses,
    read2SpeakCheckpoints,
    countries: Object.keys(regionalNotes)
  };
})();
