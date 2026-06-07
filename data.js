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
      scenarioIds: ["hostel", "meeting-locals", "taxi-ride"]
    },
    {
      month: 2,
      title: "Make survival Spanish automatic",
      focus: "Core verbs, questions, prices, directions, time, and repair phrases.",
      studySpanishFocus: "questions, numbers, time, ser and estar, tener, venir, and ir",
      listeningStage: 1,
      scenarioIds: ["directions", "bus-ticket", "market-shopping"]
    },
    {
      month: 3,
      title: "Handle food and accommodation",
      focus: "Ordering, dietary needs, booking details, check-in, and polite requests.",
      studySpanishFocus: "restaurant vocabulary, direct objects, gustar-like verbs, and polite requests",
      listeningStage: 2,
      scenarioIds: ["food", "hostel", "checkout-charge"]
    },
    {
      month: 4,
      title: "Move around confidently",
      focus: "Transport, route questions, near future, simple past events, and practical problems.",
      studySpanishFocus: "public transport vocabulary, ir a, prepositions, and the preterite",
      listeningStage: 2,
      scenarioIds: ["bus-ticket", "directions", "taxi-ride", "lost-item"]
    },
    {
      month: 5,
      title: "Activate your speaking",
      focus: "Daily self-talk, phrase mining, short conversations, and explaining minor problems.",
      studySpanishFocus: "reflexive verbs, present progressive, object pronouns, and practical problem vocabulary",
      listeningStage: 3,
      scenarioIds: ["booking-problem", "laundry", "sim-card", "money-atm"]
    },
    {
      month: 6,
      title: "Connect days and stories",
      focus: "Routine, recent past, sequencing, longer answers, and conversational follow-ups.",
      studySpanishFocus: "preterite and imperfect forms, sequencing expressions, and everyday routines",
      listeningStage: 3,
      scenarioIds: ["meeting-locals", "food", "market-shopping"]
    },
    {
      month: 7,
      title: "Bridge toward A2+",
      focus: "Past tense contrast, descriptions, preferences, and sustained five-minute conversations.",
      studySpanishFocus: "preterite versus imperfect, comparisons, descriptions, and preferences",
      listeningStage: 4,
      scenarioIds: ["meeting-locals", "tour-booking", "safety"]
    },
    {
      month: 8,
      title: "Express opinions",
      focus: "Reasons, comparisons, recommendations, uncertainty, and reacting naturally.",
      studySpanishFocus: "por and para, comparisons, the present subjunctive, and expressions of doubt",
      listeningStage: 4,
      scenarioIds: ["meeting-locals", "food", "tour-booking", "safety"]
    },
    {
      month: 9,
      title: "Tell useful travel stories",
      focus: "Narrating journeys, mishaps, highlights, background detail, and intermediate listening.",
      studySpanishFocus: "past-tense contrast, relative pronouns, adverbs, and travel-story vocabulary",
      listeningStage: 5,
      scenarioIds: ["lost-item", "baggage-claim", "booking-problem", "border"]
    },
    {
      month: 10,
      title: "Simulate real travel",
      focus: "Health, logistics, money, safety, and complete scenario runs under light pressure.",
      studySpanishFocus: "formal commands, object pronouns with commands, health, injuries, and emergency vocabulary",
      listeningStage: 5,
      scenarioIds: ["pharmacy", "clinic-visit", "money-atm", "emergency-help", "safety"]
    },
    {
      month: 11,
      title: "Prepare your route",
      focus: "Regional listening, country-specific vocabulary, border travel, and full-day simulations.",
      studySpanishFocus: "future and conditional forms, travel vocabulary, idioms, and cultural notes",
      listeningStage: 6,
      scenarioIds: ["airport-check-in", "flight-disruption", "border", "bus-ticket", "hostel"]
    },
    {
      month: 12,
      title: "Become travel ready",
      focus: "Fast retrieval, emergency language, weak-point repair, and final departure rehearsals.",
      studySpanishFocus: "commands, tense review, accentuation, and your weakest grammar or pronunciation topics",
      listeningStage: 6,
      scenarioIds: ["emergency-help", "clinic-visit", "flight-disruption", "border", "lost-item", "booking-problem"]
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
    ["Por favor, escriba la dirección.", "Please write down the address.", "Emergency"],
    ["¿Dónde recojo el equipaje?", "Where do I collect the luggage?", "Airport"],
    ["Mi equipaje no llegó.", "My luggage didn’t arrive.", "Airport"],
    ["¿En qué puerta embarcamos?", "Which gate do we board at?", "Airport"],
    ["¿Tengo que volver a facturar el equipaje?", "Do I need to check the luggage in again?", "Airport"],
    ["¿Dónde puedo conseguir un taxi autorizado?", "Where can I get an authorised taxi?", "Airport"],
    ["Quisiera un boleto de ida para…", "I’d like a one-way ticket to…", "Transport"],
    ["Quisiera un boleto de ida y vuelta para…", "I’d like a return ticket to…", "Transport"],
    ["¿Hay una salida más temprano?", "Is there an earlier departure?", "Transport"],
    ["¿En qué andén sale?", "Which platform does it leave from?", "Transport"],
    ["¿Este autobús para en…?", "Does this bus stop in…?", "Transport"],
    ["Avíseme cuando lleguemos, por favor.", "Please tell me when we arrive.", "Transport"],
    ["¿Puede dejarme aquí, por favor?", "Can you drop me off here, please?", "Transport"],
    ["¿Usa taxímetro?", "Do you use the meter?", "Transport"],
    ["¿Cuánto cuesta aproximadamente hasta…?", "Approximately how much is it to…?", "Transport"],
    ["¿Puedo dejar el equipaje antes de registrarme?", "Can I leave my luggage before check-in?", "Accommodation"],
    ["¿Puedo guardar el equipaje después de la salida?", "Can I store my luggage after checkout?", "Accommodation"],
    ["¿Está incluido el desayuno?", "Is breakfast included?", "Accommodation"],
    ["¿Hay agua caliente?", "Is there hot water?", "Accommodation"],
    ["No funciona el aire acondicionado.", "The air conditioning isn’t working.", "Accommodation"],
    ["No hay agua en la habitación.", "There is no water in the room.", "Accommodation"],
    ["Necesito otra llave, por favor.", "I need another key, please.", "Accommodation"],
    ["¿Podrían cambiarme de habitación?", "Could you move me to another room?", "Accommodation"],
    ["¿Qué lleva este plato?", "What is in this dish?", "Food"],
    ["¿Tiene carne, pescado o caldo de carne?", "Does it contain meat, fish, or meat stock?", "Food"],
    ["¿Lo puede preparar sin…?", "Can you prepare it without…?", "Food"],
    ["Para llevar, por favor.", "To take away, please.", "Food"],
    ["¿Me trae agua sin gas, por favor?", "Could you bring me still water, please?", "Food"],
    ["¿Podemos pagar por separado?", "Can we pay separately?", "Food"],
    ["Pedí esto, pero me trajeron otra cosa.", "I ordered this, but I was brought something else.", "Food"],
    ["¿Todavía están sirviendo comida?", "Are you still serving food?", "Food"],
    ["¿Tiene cambio?", "Do you have change?", "Money"],
    ["¿Puedo pagar en efectivo?", "Can I pay in cash?", "Money"],
    ["¿Este es el precio final?", "Is this the final price?", "Money"],
    ["¿Hay alguna comisión?", "Is there a fee?", "Money"],
    ["Quisiera cambiar dinero.", "I’d like to exchange money.", "Money"],
    ["¿Me puede dar un recibo?", "Can you give me a receipt?", "Money"],
    ["Estoy buscando esta dirección.", "I’m looking for this address.", "Directions"],
    ["¿Voy bien para…?", "Am I going the right way to…?", "Directions"],
    ["¿A cuántas cuadras está?", "How many blocks away is it?", "Directions"],
    ["Entonces, ¿sigo derecho y giro a la izquierda?", "So, do I go straight and turn left?", "Directions"],
    ["¿Está abierto hoy?", "Is it open today?", "Directions"],
    ["¿Cuál es la contraseña del wifi?", "What is the Wi-Fi password?", "Connectivity"],
    ["No tengo señal.", "I don’t have a signal.", "Connectivity"],
    ["Los datos móviles no funcionan.", "Mobile data isn’t working.", "Connectivity"],
    ["¿Dónde puedo hacer una recarga?", "Where can I top up?", "Connectivity"],
    ["¿Cuántos gigas incluye?", "How many gigabytes does it include?", "Connectivity"],
    ["Tengo estos síntomas desde hace dos días.", "I’ve had these symptoms for two days.", "Health"],
    ["Estoy tomando este medicamento.", "I’m taking this medication.", "Health"],
    ["No tengo alergias conocidas.", "I have no known allergies.", "Health"],
    ["Necesito ver a un médico.", "I need to see a doctor.", "Health"],
    ["¿Necesito una receta?", "Do I need a prescription?", "Health"],
    ["¿Tiene algo para el dolor de estómago?", "Do you have something for stomach pain?", "Health"],
    ["¿Puede llamar a una ambulancia?", "Can you call an ambulance?", "Emergency"],
    ["¿Dónde está el hospital más cercano?", "Where is the nearest hospital?", "Emergency"],
    ["Necesito contactar con mi embajada.", "I need to contact my embassy.", "Emergency"],
    ["¿Puede pedir un taxi seguro para mí?", "Can you call a safe taxi for me?", "Safety"],
    ["Me robaron el teléfono.", "My phone was stolen.", "Safety"],
    ["Quiero denunciar un robo.", "I want to report a theft.", "Safety"],
    ["¿Dónde está la comisaría más cercana?", "Where is the nearest police station?", "Safety"],
    ["Esta es la dirección donde me voy a alojar.", "This is the address where I’ll be staying.", "Border"],
    ["Tengo un vuelo de salida el…", "I have an onward flight on…", "Border"],
    ["Después voy a viajar a…", "Afterwards I’m going to travel to…", "Border"],
    ["¿Dónde está el baño?", "Where is the bathroom?", "Daily life"],
    ["¿Puedo llenar mi botella de agua aquí?", "Can I fill my water bottle here?", "Daily life"],
    ["¿Dónde puedo comprar agua potable?", "Where can I buy drinking water?", "Daily life"],
    ["¿A qué hora abre y cierra?", "What time does it open and close?", "Daily life"],
    ["¿Todavía hay cupo para hoy?", "Is there still availability for today?", "Bookings"],
    ["Quisiera confirmar mi reserva.", "I’d like to confirm my booking.", "Bookings"],
    ["¿Qué incluye el precio?", "What does the price include?", "Bookings"],
    ["¿Dónde es el punto de encuentro?", "Where is the meeting point?", "Bookings"],
    ["¿A qué hora regresamos?", "What time do we return?", "Bookings"],
    ["¿Puedo cancelar o cambiar la fecha?", "Can I cancel or change the date?", "Bookings"],
    ["¿Qué significa esta palabra?", "What does this word mean?", "Repair"],
    ["Entiendo un poco, pero necesito que hable más despacio.", "I understand a little, but I need you to speak more slowly.", "Repair"],
    ["¿Puede escribirlo, por favor?", "Can you write it down, please?", "Repair"],
    ["Entonces, ¿quiere decir que…?", "So, do you mean that…?", "Repair"],
    ["¿Qué me recomienda pedir aquí?", "What do you recommend ordering here?", "Conversation"],
    ["¿Cómo se llega mejor a…?", "What is the best way to get to…?", "Conversation"],
    ["¿Hay algo especial que deba saber?", "Is there anything special I should know?", "Conversation"],
    ["Gracias por su paciencia.", "Thank you for your patience.", "Essentials"]
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

  const speakingExercises = [
    {
      id: "introduce-yourself",
      title: "Meet another traveller",
      prompt: "Introduce yourself, say where you are from, and explain why you are learning Spanish.",
      focus: "confidence",
      targets: ["Give three connected details", "Ask one question back"],
      followUps: ["How long will you travel?", "Which place are you most excited to visit?"],
      support: [["Estoy aprendiendo español porque…", "I am learning Spanish because…"], ["¿Y tú?", "And you?"]]
    },
    {
      id: "daily-routine",
      title: "Describe your normal day",
      prompt: "Describe your day from waking up to going to bed.",
      focus: "grammar",
      targets: ["Use sequencing words", "Include one reflexive verb"],
      followUps: ["What changes at weekends?", "Which part of the day do you prefer?"],
      support: [["Primero…", "First…"], ["Después suelo…", "Afterwards I usually…"]]
    },
    {
      id: "tomorrow-plan",
      title: "Plan tomorrow",
      prompt: "Explain tomorrow’s plan, including where you are going and what you need to do.",
      focus: "grammar",
      targets: ["Use voy a three times", "Mention a time and place"],
      followUps: ["What will you do if it rains?", "Who will go with you?"],
      support: [["Mañana voy a…", "Tomorrow I am going to…"], ["Si tengo tiempo…", "If I have time…"]]
    },
    {
      id: "order-meal",
      title: "Order a meal",
      prompt: "Order a meal, ask two questions about the menu, and request the bill.",
      focus: "vocabulary",
      targets: ["Make a polite request", "Check one ingredient"],
      followUps: ["What do you recommend?", "Does this contain nuts or dairy?"],
      support: [["Quisiera pedir…", "I would like to order…"], ["¿Me trae la cuenta, por favor?", "Could you bring me the bill, please?"]]
    },
    {
      id: "directions",
      title: "Confirm directions",
      prompt: "Ask how to reach a bus station, then repeat the route back to confirm it.",
      focus: "listening-response",
      targets: ["Ask for repetition", "Confirm two route details"],
      followUps: ["How long does it take?", "Is it safe to walk there?"],
      support: [["¿Cómo llego a…?", "How do I get to…?"], ["Entonces, sigo recto y luego…", "So, I go straight and then…"]]
    },
    {
      id: "booking-problem",
      title: "Solve a booking problem",
      prompt: "Explain that an accommodation booking cannot be found and ask what options are available.",
      focus: "confidence",
      targets: ["State the problem clearly", "Ask for a practical solution"],
      followUps: ["Can you check the confirmation number?", "Is another room available?"],
      support: [["Tengo una reserva a nombre de…", "I have a reservation under…"], ["¿Qué podemos hacer?", "What can we do?"]]
    },
    {
      id: "pharmacy",
      title: "Ask at a pharmacy",
      prompt: "Describe two symptoms, say how long you have had them, and ask for advice.",
      focus: "vocabulary",
      targets: ["Name symptoms", "Explain duration and severity"],
      followUps: ["How often should I take it?", "Do I need to see a doctor?"],
      support: [["Me duele…", "My … hurts"], ["Tengo esto desde hace…", "I have had this for…"]]
    },
    {
      id: "travel-route",
      title: "Explain your route",
      prompt: "Talk through your likely travel route and explain why you chose three stops.",
      focus: "fluency",
      targets: ["Connect at least four ideas", "Give reasons with porque"],
      followUps: ["How will you travel between them?", "Where might you stay longer?"],
      support: [["Primero quiero ir a…", "First I want to go to…"], ["Elegí este lugar porque…", "I chose this place because…"]]
    },
    {
      id: "compare-places",
      title: "Compare two places",
      prompt: "Compare where you live with a Latin American place you want to visit.",
      focus: "grammar",
      targets: ["Make three comparisons", "Mention weather, size, or pace"],
      followUps: ["Which place seems more affordable?", "What might be difficult to adjust to?"],
      support: [["Es más… que…", "It is more… than…"], ["En cambio…", "On the other hand…"]]
    },
    {
      id: "journey-story",
      title: "Tell a journey story",
      prompt: "Tell the story of a journey that went well or badly.",
      focus: "fluency",
      targets: ["Set the scene", "Describe the problem and outcome"],
      followUps: ["How did you feel?", "What would you do differently?"],
      support: [["Todo empezó cuando…", "It all started when…"], ["Al final…", "In the end…"]]
    },
    {
      id: "preferences",
      title: "Explain your preferences",
      prompt: "Explain what kind of food, weather, accommodation, and activities you prefer while travelling.",
      focus: "vocabulary",
      targets: ["Give four preferences", "Explain at least two reasons"],
      followUps: ["What would you avoid?", "Which preference is flexible?"],
      support: [["Prefiero… porque…", "I prefer… because…"], ["No me importa si…", "I do not mind if…"]]
    },
    {
      id: "local-recommendations",
      title: "Ask for recommendations",
      prompt: "Ask a local for recommendations, react to the answer, and ask two follow-up questions.",
      focus: "listening-response",
      targets: ["React naturally", "Ask specific follow-ups"],
      followUps: ["Is it busy at weekends?", "What is the best time to go?"],
      support: [["¿Qué me recomienda?", "What do you recommend?"], ["Suena bien. ¿Y…?", "That sounds good. And…?"]]
    },
    {
      id: "lost-item",
      title: "Report a lost item",
      prompt: "Explain that you lost an important item, describe it, and say where you last saw it.",
      focus: "vocabulary",
      targets: ["Describe colour, size, and contents", "Give a time and location"],
      followUps: ["Has anyone handed it in?", "What should you do next?"],
      support: [["He perdido…", "I have lost…"], ["La última vez que lo vi fue…", "The last time I saw it was…"]]
    },
    {
      id: "yesterday",
      title: "Describe yesterday",
      prompt: "Describe what you did yesterday in chronological order.",
      focus: "grammar",
      targets: ["Use at least four past-tense verbs", "Connect events clearly"],
      followUps: ["What was the best moment?", "Did anything unexpected happen?"],
      support: [["Ayer fui a…", "Yesterday I went to…"], ["Luego decidí…", "Then I decided…"]]
    },
    {
      id: "travel-challenge",
      title: "Prepare for a challenge",
      prompt: "Describe a challenge you expect while travelling and explain how you will handle it.",
      focus: "confidence",
      targets: ["Explain the risk", "Give a step-by-step response"],
      followUps: ["Who could help?", "What could you prepare in advance?"],
      support: [["Me preocupa…", "I am worried about…"], ["Si pasa, voy a…", "If it happens, I am going to…"]]
    },
    {
      id: "media-summary",
      title: "Summarise Spanish input",
      prompt: "Give a short summary of something you recently watched or heard in Spanish.",
      focus: "fluency",
      targets: ["State the main idea", "Mention two details without translating"],
      followUps: ["What did you understand easily?", "What was still unclear?"],
      support: [["Se trataba de…", "It was about…"], ["Lo principal es que…", "The main point is that…"]]
    },
    {
      id: "make-a-plan",
      title: "Make plans with someone",
      prompt: "Roleplay meeting another traveller and agreeing on an activity, time, and meeting place.",
      focus: "listening-response",
      targets: ["Make a suggestion", "Accept or adjust a plan"],
      followUps: ["What if that time is inconvenient?", "How will you recognise each other?"],
      support: [["¿Te apetece…?", "Do you feel like…?"], ["¿Qué tal si quedamos a las…?", "How about meeting at…?"]]
    },
    {
      id: "dietary-needs",
      title: "Explain dietary needs",
      prompt: "Explain your dietary needs or allergies and check that a meal is suitable.",
      focus: "confidence",
      targets: ["State what you cannot eat", "Confirm preparation or ingredients"],
      followUps: ["Is it cooked separately?", "What alternative is available?"],
      support: [["Soy alérgico/a a…", "I am allergic to…"], ["¿Lleva…?", "Does it contain…?"]]
    },
    {
      id: "choose-destination",
      title: "Choose between destinations",
      prompt: "Compare two countries or cities on your route and decide which you would visit first.",
      focus: "grammar",
      targets: ["Compare at least three factors", "State and defend a decision"],
      followUps: ["Which is easier to reach?", "Which offers something unique?"],
      support: [["Por un lado…", "On one hand…"], ["Me quedaría con…", "I would choose…"]]
    },
    {
      id: "complete-travel-day",
      title: "Simulate a travel day",
      prompt: "Talk yourself through a complete travel day from checkout to arriving at the next accommodation.",
      focus: "fluency",
      targets: ["Cover five stages", "Include one possible problem"],
      followUps: ["What must you confirm?", "What will you do on arrival?"],
      support: [["Antes de salir…", "Before leaving…"], ["Cuando llegue…", "When I arrive…"]]
    },
    {
      id: "airport-check-in",
      title: "Check in for a flight",
      prompt: "Check in for a flight, ask about your bag, and confirm the gate and boarding time.",
      focus: "vocabulary",
      targets: ["Give booking details", "Confirm two pieces of information"],
      followUps: ["Is the flight on time?", "Can you choose an aisle seat?"],
      support: [["Aquí tiene mi pasaporte.", "Here is my passport."], ["¿A qué hora empieza el embarque?", "What time does boarding begin?"]]
    },
    {
      id: "bus-delay",
      title: "Handle a bus delay",
      prompt: "Ask why a bus is delayed, whether it will still leave today, and what alternatives exist.",
      focus: "listening-response",
      targets: ["Ask three direct questions", "Repeat the answer to confirm"],
      followUps: ["Can the ticket be changed?", "Where will updates appear?"],
      support: [["¿Cuánto retraso lleva?", "How delayed is it?"], ["Entonces, ¿sale a las…?", "So, does it leave at…?"]]
    },
    {
      id: "taxi-ride",
      title: "Manage a taxi ride",
      prompt: "Give a destination, confirm the approximate fare, and ask the driver to use a safer or faster route.",
      focus: "confidence",
      targets: ["Confirm price before leaving", "Give one route instruction"],
      followUps: ["Can you pay by card?", "Could the driver stop here?"],
      support: [["¿Cuánto cuesta más o menos?", "About how much does it cost?"], ["¿Puede dejarme aquí?", "Can you drop me here?"]]
    },
    {
      id: "market-bargain",
      title: "Buy something at a market",
      prompt: "Ask about an item, its price and material, then politely negotiate or decline.",
      focus: "vocabulary",
      targets: ["Ask three product questions", "Close the exchange politely"],
      followUps: ["Is there another size?", "What price could you offer?"],
      support: [["¿De qué está hecho?", "What is it made of?"], ["¿Me lo deja en…?", "Would you let me have it for…?"]]
    },
    {
      id: "atm-problem",
      title: "Explain an ATM problem",
      prompt: "Explain that an ATM kept your card or did not give you cash, and ask for immediate help.",
      focus: "confidence",
      targets: ["State exactly what happened", "Ask what to do next"],
      followUps: ["Was your account charged?", "When can the card be recovered?"],
      support: [["El cajero se quedó con mi tarjeta.", "The ATM kept my card."], ["¿Puede ayudarme ahora?", "Can you help me now?"]]
    },
    {
      id: "border-questions",
      title: "Answer border questions",
      prompt: "Answer questions about your travel purpose, planned stay, accommodation, and onward journey.",
      focus: "confidence",
      targets: ["Give concise answers", "State dates and destinations clearly"],
      followUps: ["Where are you staying first?", "Do you have proof of onward travel?"],
      support: [["Vengo de turismo.", "I am here as a tourist."], ["Pienso quedarme hasta…", "I plan to stay until…"]]
    },
    {
      id: "clinic-visit",
      title: "Speak to a clinician",
      prompt: "Describe what happened, your symptoms, and any medicine or allergies the clinician should know about.",
      focus: "vocabulary",
      targets: ["Describe onset and severity", "Answer likely follow-up questions"],
      followUps: ["Does movement make it worse?", "Have you taken any medicine?"],
      support: [["Empezó hace…", "It started … ago"], ["Soy alérgico/a a…", "I am allergic to…"]]
    },
    {
      id: "emergency-call",
      title: "Make an emergency call",
      prompt: "State where you are, what happened, how many people need help, and any immediate danger.",
      focus: "confidence",
      targets: ["Lead with location", "Use short, clear sentences"],
      followUps: ["Is anyone unconscious?", "Can you stay on the line?"],
      support: [["Necesitamos ayuda en…", "We need help at…"], ["Hay una persona que…", "There is a person who…"]]
    },
    {
      id: "tour-booking",
      title: "Book a tour",
      prompt: "Ask about a tour’s schedule, difficulty, group size, inclusions, and cancellation policy.",
      focus: "vocabulary",
      targets: ["Ask four practical questions", "Confirm the final arrangement"],
      followUps: ["What should you bring?", "Is transport included?"],
      support: [["¿Qué incluye el precio?", "What does the price include?"], ["Quisiera reservar para…", "I would like to book for…"]]
    },
    {
      id: "social-invitation",
      title: "Respond to an invitation",
      prompt: "Respond to a social invitation, ask for the practical details, and accept or decline naturally.",
      focus: "listening-response",
      targets: ["Show interest before deciding", "Ask about time and place"],
      followUps: ["Should you bring anything?", "Who else will be there?"],
      support: [["¡Qué buena idea!", "What a good idea!"], ["Me encantaría, pero…", "I would love to, but…"]]
    }
  ];

  const scenarios = [
    {
      id: "hostel",
      title: "Hostel check-in",
      category: "Accommodation",
      situation: "You arrive tired, confirm your booking, ask about breakfast and checkout, and solve one missing detail.",
      vocabulary: ["reserva", "habitación", "cama", "llave", "salida"],
      phrases: ["Tengo una reserva a nombre de…", "¿Está incluido el desayuno?", "¿A qué hora es la salida?"],
      cues: ["Say the booking is under your name.", "Ask whether breakfast is included.", "Confirm the checkout time."],
      roleplay: "You are the guest. The receptionist cannot initially find your reservation."
    },
    {
      id: "bus-ticket",
      title: "Buying a bus ticket",
      category: "Transport",
      situation: "Buy a ticket for your next destination and clarify departure point, journey time, and connections.",
      vocabulary: ["boleto / billete", "terminal", "andén", "directo", "ida"],
      phrases: ["Un boleto para…, por favor.", "¿De dónde sale?", "¿Es directo?"],
      cues: ["Ask for one ticket to your destination.", "Confirm where the bus leaves from.", "Ask whether the journey is direct."],
      roleplay: "The direct bus is full. Ask about the best alternative."
    },
    {
      id: "food",
      title: "Ordering food",
      category: "Food",
      situation: "Ask about a dish, order politely, explain a dietary need, and request the bill.",
      vocabulary: ["menú", "plato", "ingredientes", "sin", "cuenta"],
      phrases: ["¿Qué lleva este plato?", "Quisiera pedir…", "La cuenta, por favor."],
      cues: ["Ask what a dish contains.", "Order what you want politely.", "Ask for the bill."],
      roleplay: "One ingredient is unavailable. Ask for a suitable alternative."
    },
    {
      id: "directions",
      title: "Asking for directions",
      category: "Directions",
      situation: "Find a bus terminal and confirm whether you can walk there safely.",
      vocabulary: ["derecho", "esquina", "cuadra", "girar", "cerca"],
      phrases: ["¿Cómo llego a…?", "¿Está lejos?", "Entonces, sigo derecho y…"],
      cues: ["Ask how to reach the terminal.", "Ask whether it is far away.", "Repeat the first direction back to confirm it."],
      roleplay: "The first explanation is too fast. Ask for repetition and confirm each step."
    },
    {
      id: "pharmacy",
      title: "Pharmacy and health",
      category: "Health",
      situation: "Describe a minor symptom, say how long it has lasted, and understand basic medicine instructions.",
      vocabulary: ["dolor", "fiebre", "pastilla", "dosis", "receta"],
      phrases: ["Me duele…", "Desde hace dos días.", "¿Cada cuántas horas?"],
      cues: ["Say what hurts.", "Explain how long the symptom has lasted.", "Ask how often to take the medicine."],
      roleplay: "The pharmacist asks about allergies and other medication."
    },
    {
      id: "sim-card",
      title: "SIM card setup",
      category: "Connectivity",
      situation: "Buy a prepaid SIM, choose a data package, and make sure it is activated.",
      vocabulary: ["chip / tarjeta SIM", "datos", "prepago", "recarga", "señal"],
      phrases: ["Necesito una SIM con datos.", "¿Cuántos gigas incluye?", "¿Puede activarla?"],
      cues: ["Ask for a SIM with mobile data.", "Ask how many gigabytes are included.", "Ask the staff member to activate it."],
      roleplay: "Your phone does not connect after installation. Explain what you see."
    },
    {
      id: "laundry",
      title: "Laundry",
      category: "Daily life",
      situation: "Ask for a wash service, clarify price and collection time, and mention one delicate item.",
      vocabulary: ["lavar", "secar", "kilo", "delicado", "listo"],
      phrases: ["Quisiera lavar esta ropa.", "¿Cuánto cuesta por kilo?", "¿Cuándo estará lista?"],
      cues: ["Say you would like these clothes washed.", "Ask for the price per kilogram.", "Ask when the clothes will be ready."],
      roleplay: "You need the clothes before an early departure tomorrow."
    },
    {
      id: "border",
      title: "Border crossing",
      category: "Border",
      situation: "Answer routine immigration questions about purpose, length of stay, route, and accommodation.",
      vocabulary: ["turismo", "estadía", "salida", "alojamiento", "pasaporte"],
      phrases: ["Estoy aquí por turismo.", "Voy a quedarme…", "Después voy a viajar a…"],
      cues: ["Explain that you are visiting as a tourist.", "Say how long you will stay.", "Describe where you will travel next."],
      roleplay: "The officer asks for proof of onward travel and your first address."
    },
    {
      id: "safety",
      title: "Asking about safety",
      category: "Safety",
      situation: "Ask trusted local staff about transport, neighbourhoods, and walking after dark.",
      vocabulary: ["seguro", "evitar", "barrio", "de noche", "taxi"],
      phrases: ["¿Es seguro caminar por aquí?", "¿Qué zona debo evitar?", "¿Cuál es la opción más segura?"],
      cues: ["Ask whether it is safe to walk nearby.", "Ask which area you should avoid.", "Ask for the safest option."],
      roleplay: "Your original route is not recommended. Ask for a practical alternative."
    },
    {
      id: "meeting-locals",
      title: "Meeting locals",
      category: "Conversation",
      situation: "Introduce yourself, explain your trip, ask for recommendations, and keep the exchange moving.",
      vocabulary: ["viaje", "ruta", "recomendar", "conocer", "quedarse"],
      phrases: ["Estoy viajando por…", "¿Qué me recomienda?", "¿Y usted / tú?"],
      cues: ["Explain where you are travelling.", "Ask for a recommendation.", "Turn the conversation back to the other person."],
      roleplay: "You meet someone at a café who is curious about your route."
    },
    {
      id: "booking-problem",
      title: "Booking problem",
      category: "Problems",
      situation: "Your booking details do not match what you paid for. Explain calmly and request a solution.",
      vocabulary: ["confirmación", "pago", "cancelado", "disponible", "solución"],
      phrases: ["Hay un problema con mi reserva.", "Aquí está la confirmación.", "¿Qué solución hay?"],
      cues: ["State that there is a problem with the booking.", "Show or refer to your confirmation.", "Ask what solution is available."],
      roleplay: "The room or ticket type you booked is unavailable."
    },
    {
      id: "lost-item",
      title: "Lost item",
      category: "Problems",
      situation: "Report a lost phone, bag, or document and explain where you last had it.",
      vocabulary: ["perder", "mochila", "documento", "última vez", "encontrar"],
      phrases: ["He perdido mi…", "La última vez que lo vi fue…", "¿Hay objetos perdidos?"],
      cues: ["Say which item you have lost.", "Explain where you last saw it.", "Ask whether there is a lost-property desk."],
      roleplay: "Staff ask you to describe the item and reconstruct your route."
    },
    {
      id: "airport-check-in",
      title: "Airport check-in",
      category: "Airport",
      situation: "Check in for a flight, confirm your seat and baggage allowance, and find the correct departure gate.",
      vocabulary: ["mostrador", "equipaje", "asiento", "tarjeta de embarque", "puerta"],
      phrases: ["Quisiera facturar esta maleta.", "¿Está incluido el equipaje?", "¿De qué puerta sale el vuelo?"],
      cues: ["Say you would like to check this bag.", "Confirm whether baggage is included.", "Ask which gate the flight leaves from."],
      roleplay: "Your carry-on is over the allowed weight. Ask about your options and the extra cost."
    },
    {
      id: "flight-disruption",
      title: "Flight delay or cancellation",
      category: "Airport",
      situation: "Your flight is delayed or cancelled. Confirm the new plan, protect your connection, and ask what assistance is available.",
      vocabulary: ["retrasado", "cancelado", "conexión", "reubicar", "alojamiento"],
      phrases: ["Mi vuelo está cancelado.", "Tengo una conexión en…", "¿Puede reubicarme en otro vuelo?"],
      cues: ["State that your flight has been cancelled.", "Explain that you have a connecting flight.", "Ask to be moved to another flight."],
      roleplay: "The next direct flight is tomorrow. Ask about an indirect route and whether accommodation or meals are provided."
    },
    {
      id: "baggage-claim",
      title: "Missing baggage",
      category: "Airport",
      situation: "Your checked bag does not arrive. Report it, describe it clearly, and arrange delivery or collection.",
      vocabulary: ["equipaje", "cinta", "etiqueta", "reclamo", "entregar"],
      phrases: ["Mi maleta no llegó.", "Es una mochila grande de color…", "¿Cuándo me la pueden entregar?"],
      cues: ["Report that your bag did not arrive.", "Describe its size and colour.", "Ask when it can be delivered."],
      roleplay: "You are leaving the city tomorrow morning. Give your next address and ask how to track the report."
    },
    {
      id: "taxi-ride",
      title: "Taking a taxi",
      category: "Transport",
      situation: "Confirm the destination and approximate fare, follow the route, and pay without confusion.",
      vocabulary: ["dirección", "taxímetro", "tarifa", "efectivo", "recibo"],
      phrases: ["¿Me puede llevar a esta dirección?", "¿Puede poner el taxímetro?", "¿Me da un recibo, por favor?"],
      cues: ["Ask the driver to take you to an address.", "Ask for the meter to be used.", "Request a receipt."],
      roleplay: "The driver suggests a fixed price that seems high. Ask for the normal fare and agree on a clear option before leaving."
    },
    {
      id: "money-atm",
      title: "Cash and ATM problem",
      category: "Money",
      situation: "Withdraw cash, understand fees, and ask for help when a card or machine does not behave as expected.",
      vocabulary: ["cajero automático", "retiro", "comisión", "tarjeta", "efectivo"],
      phrases: ["Quisiera retirar efectivo.", "¿Cuánto cobra de comisión?", "El cajero retuvo mi tarjeta."],
      cues: ["Say you would like to withdraw cash.", "Ask how much the fee is.", "Explain that the ATM kept your card."],
      roleplay: "The machine charged your account but gave you no cash. Explain what happened and ask for a reference number."
    },
    {
      id: "market-shopping",
      title: "Shopping at a market",
      category: "Shopping",
      situation: "Ask about an item, understand the price and quantity, and complete a friendly purchase.",
      vocabulary: ["puesto", "precio", "talla", "medio kilo", "cambio"],
      phrases: ["¿Cuánto cuesta esto?", "¿Tiene otra talla?", "Me llevo dos, por favor."],
      cues: ["Ask how much an item costs.", "Ask whether another size is available.", "Say that you will take two."],
      roleplay: "You only have a large banknote. Confirm whether the seller has change or can accept another payment method."
    },
    {
      id: "clinic-visit",
      title: "Doctor or clinic visit",
      category: "Health",
      situation: "Arrange a consultation, describe symptoms and relevant history, and clarify the next steps.",
      vocabulary: ["consulta", "síntoma", "alergia", "seguro", "análisis"],
      phrases: ["Necesito ver a un médico.", "Tengo estos síntomas desde…", "Soy alérgico / alérgica a…"],
      cues: ["Say that you need to see a doctor.", "Explain your symptoms and when they began.", "Mention a relevant allergy."],
      roleplay: "The clinician recommends a test and medication. Ask what each is for, what it costs, and when to seek further help."
    },
    {
      id: "emergency-help",
      title: "Getting urgent help",
      category: "Emergency",
      situation: "Get immediate help, give a precise location, and explain clearly who is at risk and what happened.",
      vocabulary: ["emergencia", "ambulancia", "policía", "herido", "ubicación"],
      phrases: ["Necesito ayuda de inmediato.", "Envíe una ambulancia, por favor.", "Estamos en esta dirección…"],
      cues: ["Say that you need help immediately.", "Ask for an ambulance.", "Give your exact location."],
      roleplay: "The operator cannot see your location. Describe a nearby landmark, answer who is injured, and stay on the line."
    },
    {
      id: "tour-booking",
      title: "Booking a tour or activity",
      category: "Activities",
      situation: "Choose an activity, check what is included and required, and confirm the meeting arrangements.",
      vocabulary: ["excursión", "guía", "incluido", "punto de encuentro", "cancelar"],
      phrases: ["Quisiera reservar la excursión de…", "¿Qué está incluido?", "¿Dónde es el punto de encuentro?"],
      cues: ["Ask to book a particular excursion.", "Ask what the price includes.", "Confirm the meeting point."],
      roleplay: "The weather may affect the activity. Ask about difficulty, equipment, cancellation, and refund arrangements."
    },
    {
      id: "checkout-charge",
      title: "Checking out and questioning a charge",
      category: "Accommodation",
      situation: "Check out, review the bill, question an unfamiliar charge, and store luggage before departure.",
      vocabulary: ["factura", "cargo", "depósito", "equipaje", "devolver"],
      phrases: ["Quisiera hacer el check-out.", "No reconozco este cargo.", "¿Puedo dejar el equipaje aquí?"],
      cues: ["Say that you would like to check out.", "Question a charge you do not recognise.", "Ask to leave your luggage temporarily."],
      roleplay: "A deposit has not been returned and staff say it may take several days. Ask for written confirmation and a receipt."
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
    speakingExercises,
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
