/* ==========================================================================
   RAKSHIKA — MULTILINGUAL TRANSLATION SERVICE (JS)
   ========================================================================== */

(function () {
  'use strict';

  // Translation Dictionary
  const dictionary = {
    en: {
      // Landing Page / Common
      "One Tap Safety for Women": "One Tap Safety for Women",
      "Civilian Login": "Civilian Login",
      "Responder Desk": "Responder Desk",
      "Cyber Cell": "Cyber Cell",
      "Sign Up": "Sign Up",
      "Home": "Home",
      "Logout": "Logout",
      "Emergency Flow": "Emergency Flow",
      "Features": "Features",
      "Responder Center": "Responder Center",
      "Get Protected Now": "Get Protected Now",
      "Explore Features": "Explore Features",
      "Empowering & Protecting": "Empowering & Protecting",
      "How it works": "How it works",
      "Emergency Response Lifecycle": "Emergency Response Lifecycle",
      "A secure, multi-layered shield that coordinates community and law enforcement instantly.": "A secure, multi-layered shield that coordinates community and law enforcement instantly.",
      "Comprehensive Shield": "Comprehensive Shield",
      "Advanced Safety Features": "Advanced Safety Features",
      "More than just a distress button. A complete set of tools to prevent, defend, and document.": "More than just a distress button. A complete set of tools to prevent, defend, and document.",
      "Panic SOS Siren": "Panic SOS Siren",
      "Safe Haven Routing": "Safe Haven Routing",
      "Check-In Timer": "Check-In Timer",
      "Fake Call Simulator": "Fake Call Simulator",
      "Threat Incident Log": "Threat Incident Log",
      "Hybrid Backend": "Hybrid Backend",
      "Civilian Access Portal": "Civilian Access Portal",
      "Officer Email ID": "Officer Email ID",
      "Passcode": "Passcode",
      "Login to Control Room": "Login to Control Room",
      "Cyber Officer Email": "Cyber Officer Email",
      "Access Cyber Desk": "Access Cyber Desk",
      "Create Protected Account": "Create Protected Account",
      "Full Name": "Full Name",
      "Email Address": "Email Address",
      "Password": "Password",
      "Phone Number (with country code)": "Phone Number (with country code)",
      "Emergency Password": "Emergency Password",
      "Create Protected Profile": "Create Protected Profile",

      // User Dashboard
      "Women Safety Dashboard": "Women Safety Dashboard",
      "Emergency Trigger": "Emergency Trigger",
      "TAP TO ALERT": "TAP TO ALERT",
      "SOS": "SOS",
      "STOP": "STOP",
      "Tap to send emergency alert": "Tap to send emergency alert",
      "Silent SOS Mode": "Silent SOS Mode",
      "Track location without alarm": "Track location without alarm",
      "Safety Status": "Safety Status",
      "Safe": "Safe",
      "Alert": "Alert",
      "Emergency": "Emergency",
      "Safe Check-in Timer": "Safe Check-in Timer",
      "minutes": "minutes",
      "▶ Start Timer": "▶ Start Timer",
      "✓ Check In": "✓ Check In",
      "Auto-SOS if timer expires": "Auto-SOS if timer expires",
      "Guardians": "Guardians",
      "+ Add Guardian": "+ Add Guardian",
      "📂 Evidence Upload": "📂 Evidence Upload",
      "Drag & Drop Files Here": "Drag & Drop Files Here",
      "or click to browse · Images, Videos, Screenshots, PDFs": "or click to browse · Images, Videos, Screenshots, PDFs",
      "Upload evidence above to attach to this FIR": "Upload evidence above to attach to this FIR",
      "Submit FIR": "Submit FIR",
      "🧾 Write FIR": "🧾 Write FIR",
      "🧾 File FIR (First Information Report)": "🧾 File FIR (First Information Report)",
      "Police Stations": "Police Stations",
      "🗺 Nearest Police Stations": "🗺 Nearest Police Stations",
      "My Location": "My Location",
      "Nearby Stations": "Nearby Stations",
      "Click \"My Location\" to find nearest stations.": "Click \"My Location\" to find nearest stations.",

      // Police Dashboard
      "Police Control Center": "Police Control Center",
      "Live SOS Feed": "Live SOS Feed",
      "Live Tracking Map": "Live Tracking Map",
      "Incident Detail": "Incident Detail",
      "Movement Timeline": "Movement Timeline",
      "Incident Tracking Log": "Incident Tracking Log",
      "Active SOS": "Active SOS",
      "Investigating": "Investigating",
      "Resolved": "Resolved",
      "Total Today": "Total Today",
      "Simulate SOS": "Simulate SOS",
      "Fit All Markers": "Fit All Markers",
      "Clear Path Traces": "Clear Path Traces",

      // Cyber Dashboard
      "Cyber Cell": "Cyber Cell",
      "Case Reports": "Case Reports",
      "Evidence Viewer": "Evidence Viewer",
      "Analytics": "Analytics",
      "High Risk Cases": "High Risk Cases",
      "File New Report": "File New Report",
      "Total Cases": "Total Cases",
      "Pending": "Pending",
      "High Risk": "High Risk",
      "Clear": "Clear",
      "State Filter:": "State Filter:",
      "Search by name, city, district...": "Search by name, city, district...",
      "All States/UTs": "All States/UTs"
    },
    hi: {
      // Landing Page / Common
      "One Tap Safety for Women": "महिलाओं के लिए एक टैप सुरक्षा",
      "Civilian Login": "नागरिक लॉगिन",
      "Responder Desk": "प्रतिक्रियाकर्ता डेस्क",
      "Cyber Cell": "साइबर सेल",
      "Sign Up": "साइन अप",
      "Home": "होम",
      "Logout": "लॉगआउट",
      "Emergency Flow": "आपातकालीन प्रवाह",
      "Features": "विशेषताएं",
      "Responder Center": "प्रतिक्रिया केंद्र",
      "Get Protected Now": "अभी सुरक्षित हों",
      "Explore Features": "विशेषताओं की खोज",
      "Empowering & Protecting": "सशक्त और सुरक्षित बनाना",
      "How it works": "यह काम कैसे करता है",
      "Emergency Response Lifecycle": "आपातकालीन प्रतिक्रिया जीवनचक्र",
      "A secure, multi-layered shield that coordinates community and law enforcement instantly.": "एक सुरक्षित, बहु-स्तरीय ढाल जो समुदाय और कानून प्रवर्तन को तुरंत समन्वित करती है।",
      "Comprehensive Shield": "व्यापक सुरक्षा कवच",
      "Advanced Safety Features": "उन्नत सुरक्षा विशेषताएं",
      "More than just a distress button. A complete set of tools to prevent, defend, and document.": "सिर्फ एक संकट बटन से अधिक। बचाव, रक्षा और दस्तावेजीकरण के लिए उपकरणों का एक पूरा सेट।",
      "Panic SOS Siren": "पैनिक एसओएस सायरन",
      "Safe Haven Routing": "सुरक्षित ठिकाने की राह",
      "Check-In Timer": "चेक-इन टाइमर",
      "Fake Call Simulator": "फेक कॉल सिम्युलेटर",
      "Threat Incident Log": "खतरे की घटना का लॉग",
      "Hybrid Backend": "हाइब्रिड बैकएंड",
      "Civilian Access Portal": "नागरिक पहुंच पोर्टल",
      "Officer Email ID": "अधिकारी ईमेल आईडी",
      "Passcode": "पासकोड",
      "Login to Control Room": "कंट्रोल रूम में लॉगिन करें",
      "Cyber Officer Email": "साइबर अधिकारी ईमेल",
      "Access Cyber Desk": "साइबर डेस्क खोलें",
      "Create Protected Account": "सुरक्षित खाता बनाएं",
      "Full Name": "पूरा नाम",
      "Email Address": "ईमेल पता",
      "Password": "पासवर्ड",
      "Phone Number (with country code)": "फ़ोन नंबर (देश कोड के साथ)",
      "Emergency Password": "आपातकालीन पासवर्ड",
      "Create Protected Profile": "सुरक्षित प्रोफ़ाइल बनाएं",

      // User Dashboard
      "Women Safety Dashboard": "महिला सुरक्षा डैशबोर्ड",
      "Emergency Trigger": "आपातकालीन ट्रिगर",
      "TAP TO ALERT": "सचेत करने के लिए टैप करें",
      "SOS": "एसओएस",
      "STOP": "रोकें",
      "Tap to send emergency alert": "आपातकालीन अलर्ट भेजने के लिए टैप करें",
      "Silent SOS Mode": "साइलेंट एसओएस मोड",
      "Track location without alarm": "बिना अलार्म के स्थान ट्रैक करें",
      "Safety Status": "सुरक्षा स्थिति",
      "Safe": "सुरक्षित",
      "Alert": "सचेत",
      "Emergency": "आपातकाल",
      "Safe Check-in Timer": "सुरक्षित चेक-इन टाइमर",
      "minutes": "मिनट",
      "▶ Start Timer": "▶ टाइमर शुरू करें",
      "✓ Check In": "✓ चेक इन",
      "Auto-SOS if timer expires": "टाइमर समाप्त होने पर ऑटो-एसओएस",
      "Guardians": "अभिभावक",
      "+ Add Guardian": "+ अभिभावक जोड़ें",
      "📂 Evidence Upload": "📂 साक्ष्य अपलोड",
      "Drag & Drop Files Here": "फ़ाइलें यहाँ खींचें और छोड़ें",
      "or click to browse · Images, Videos, Screenshots, PDFs": "या ब्राउज़ करने के लिए क्लिक करें · चित्र, वीडियो, स्क्रीनशॉट, पीडीएफ",
      "Upload evidence above to attach to this FIR": "इस एफआईआर के साथ संलग्न करने के लिए ऊपर साक्ष्य अपलोड करें",
      "Submit FIR": "एफआईआर जमा करें",
      "🧾 Write FIR": "🧾 एफआईआर लिखें",
      "🧾 File FIR (First Information Report)": "🧾 एफआईआर दर्ज करें (प्रथम सूचना रिपोर्ट)",
      "Police Stations": "पुलिस स्टेशन",
      "🗺 Nearest Police Stations": "🗺 निकटतम पुलिस स्टेशन",
      "My Location": "मेरी स्थिति",
      "Nearby Stations": "आस-पास के स्टेशन",
      "Click \"My Location\" to find nearest stations.": "निकटतम पुलिस स्टेशन खोजने के लिए \"मेरी स्थिति\" पर क्लिक करें।",

      // Police Dashboard
      "Police Control Center": "पुलिस नियंत्रण केंद्र",
      "Live SOS Feed": "लाइव एसओएस फीड",
      "Live Tracking Map": "लाइव ट्रैकिंग मानचित्र",
      "Incident Detail": "घटना का विवरण",
      "Movement Timeline": "मूवमेंट टाइमलाइन",
      "Incident Tracking Log": "घटना ट्रैकिंग लॉग",
      "Active SOS": "सक्रिय एसओएस",
      "Investigating": "जांच जारी",
      "Resolved": "सुलझाया गया",
      "Total Today": "आज का कुल",
      "Simulate SOS": "एसओएस सिमुलेशन",
      "Fit All Markers": "सभी मार्कर फिट करें",
      "Clear Path Traces": "पथ निशान साफ़ करें",

      // Cyber Dashboard
      "Cyber Cell": "साइबर सेल",
      "Case Reports": "मामला रिपोर्ट",
      "Evidence Viewer": "साक्ष्य दर्शक",
      "Analytics": "विश्लेषण",
      "High Risk Cases": "उच्च जोखिम वाले मामले",
      "File New Report": "नई रिपोर्ट दर्ज करें",
      "Total Cases": "कुल मामले",
      "Pending": "लंबित",
      "High Risk": "उच्च जोखिम",
      "Clear": "साफ़ करें",
      "State Filter:": "राज्य फ़िल्टर:",
      "Search by name, city, district...": "नाम, शहर, जिले से खोजें...",
      "All States/UTs": "सभी राज्य/केंद्र शासित प्रदेश"
    },
    mr: {
      // Landing Page / Common
      "One Tap Safety for Women": "महिलांसाठी एक टॅप सुरक्षा",
      "Civilian Login": "नागरिक लॉगिन",
      "Responder Desk": "प्रतिक्रिया केंद्र",
      "Cyber Cell": "सायबर सेल",
      "Sign Up": "नोंदणी करा",
      "Home": "मुख्यपृष्ठ",
      "Logout": "लॉगआउट",
      "Emergency Flow": "आपातकालीन प्रवाह",
      "Features": "वैशिष्ट्ये",
      "Responder Center": "प्रतिक्रिया केंद्र",
      "Get Protected Now": "आताच सुरक्षित व्हा",
      "Explore Features": "वैशिष्ट्ये एक्सप्लोर करा",
      "Empowering & Protecting": "सशक्त आणि सुरक्षित करणे",
      "How it works": "हे कसे कार्य करते",
      "Emergency Response Lifecycle": "आपातकालीन प्रतिसाद जीवनचक्र",
      "A secure, multi-layered shield that coordinates community and law enforcement instantly.": "एक सुरक्षित, बहु-स्तरीय कवच जे तात्काळ समुदाय आणि पोलीस यंत्रणेला जोडते.",
      "Comprehensive Shield": "सर्वसमावेशक सुरक्षा कवच",
      "Advanced Safety Features": "प्रगत सुरक्षा वैशिष्ट्ये",
      "More than just a distress button. A complete set of tools to prevent, defend, and document.": "केवळ संकट बटन नाही. बचाव, संरक्षण आणि नोंदींसाठी साधनांचा संपूर्ण संच.",
      "Panic SOS Siren": "पॅनिक एसओएस सायरन",
      "Safe Haven Routing": "सुरक्षित मार्ग नियोजन",
      "Check-In Timer": "चेक-इन टाइमर",
      "Fake Call Simulator": "फेक कॉल सिम्युलेटर",
      "Threat Incident Log": "धोक्याच्या घटनांची नोंद",
      "Hybrid Backend": "हायब्रिड बॅकएंड",
      "Civilian Access Portal": "नागरिक प्रवेश पोर्टल",
      "Officer Email ID": "अधिकारी ईमेल आयडी",
      "Passcode": "पासकोड",
      "Login to Control Room": "कंट्रोल रूममध्ये लॉगिन करा",
      "Cyber Officer Email": "सायबर अधिकारी ईमेल",
      "Access Cyber Desk": "सायबर डेस्क उघडा",
      "Create Protected Account": "सुरक्षित खाते तयार करा",
      "Full Name": "पूर्ण नाव",
      "Email Address": "ईमेल पत्ता",
      "Password": "पासवर्ड",
      "Phone Number (with country code)": "फोन नंबर (देश कोडसह)",
      "Emergency Password": "आपातकालीन पासवर्ड",
      "Create Protected Profile": "सुरक्षित प्रोफाईल तयार करा",

      // User Dashboard
      "Women Safety Dashboard": "महिला सुरक्षा डॅशबोर्ड",
      "Emergency Trigger": "आपातकालीन ट्रिगर",
      "TAP TO ALERT": "अलर्ट करण्यासाठी टॅप करा",
      "SOS": "एसओएस",
      "STOP": "थांबवा",
      "Tap to send emergency alert": "आपातकालीन अलर्ट पाठवण्यासाठी टॅप करा",
      "Silent SOS Mode": "सायलेंट एसओएस मोड",
      "Track location without alarm": "अलार्मशिवाय स्थान ट्रॅक करा",
      "Safety Status": "सुरक्षा स्थिती",
      "Safe": "सुरक्षित",
      "Alert": "सचेत",
      "Emergency": "आपातकालीन",
      "Safe Check-in Timer": "सुरक्षित चेक-इन टाइमर",
      "minutes": "मिनिटे",
      "▶ Start Timer": "▶ टाइमर सुरू करा",
      "✓ Check In": "✓ चेक इन",
      "Auto-SOS if timer expires": "टाइमर संपल्यावर ऑटो-एसओएस",
      "Guardians": "पालक",
      "+ Add Guardian": "+ पालक जोडा",
      "📂 Evidence Upload": "📂 पुरावा अपलोड",
      "Drag & Drop Files Here": "फाईल्स येथे खेचा आणि सोडा",
      "or click to browse · Images, Videos, Screenshots, PDFs": "किंवा ब्राउझ करण्यासाठी क्लिक करा · चित्रे, व्हिडिओ, स्क्रीनशॉट्स, पीडीएफ",
      "Upload evidence above to attach to this FIR": "या एफआयआरसोबत जोडण्यासाठी वर पुरावा अपलोड करा",
      "Submit FIR": "एफआयआर सादर करा",
      "🧾 Write FIR": "🧾 एफआयआर लिहा",
      "🧾 File FIR (First Information Report)": "🧾 एफआयआर दाखल करा",
      "Police Stations": "पोलीस स्टेशन",
      "🗺 Nearest Police Stations": "🗺 जवळचे पोलीस स्टेशन",
      "My Location": "माझे स्थान",
      "Nearby Stations": "जवळचे स्टेशन",
      "Click \"My Location\" to find nearest stations.": "जवळचे पोलीस स्टेशन शोधण्यासाठी \"माझे स्थान\" वर क्लिक करा.",

      // Police Dashboard
      "Police Control Center": "पोलीस नियंत्रण केंद्र",
      "Live SOS Feed": "थेट एसओएस फीड",
      "Live Tracking Map": "थेट ट्रॅकिंग नकाशा",
      "Incident Detail": "घटनेचा तपशील",
      "Movement Timeline": "हालचालींची टाइमलाईन",
      "Incident Tracking Log": "घटना ट्रॅकिंग लॉग",
      "Active SOS": "सक्रिय एसओएस",
      "Investigating": "तपास सुरू",
      "Resolved": "निकाली काढले",
      "Total Today": "आजचे एकूण",
      "Simulate SOS": "एसओएस सिम्युलेशन",
      "Fit All Markers": "सर्व मार्कर्स फिट करा",
      "Clear Path Traces": "नकाशा मार्ग साफ करा",

      // Cyber Dashboard
      "Cyber Cell": "सायबर सेल",
      "Case Reports": "प्रकरण अहवाल",
      "Evidence Viewer": "पुरावा दर्शक",
      "Analytics": "विश्लेषण",
      "High Risk Cases": "उच्च जोखीम प्रकरणे",
      "File New Report": "नवीन तक्रार नोंदवा",
      "Total Cases": "एकूण प्रकरणे",
      "Pending": "लंबित",
      "High Risk": "उच्च जोखीम",
      "Clear": "साफ करा",
      "State Filter:": "राज्य फिल्टर:",
      "Search by name, city, district...": "नाव, शहर, जिल्ह्याद्वारे शोधा...",
      "All States/UTs": "सर्व राज्ये/केंद्रशासित प्रदेश"
    },
    es: {
      // Landing Page / Common
      "One Tap Safety for Women": "Seguridad en un toque para mujeres",
      "Civilian Login": "Acceso Civil",
      "Responder Desk": "Mesa de Respondedores",
      "Cyber Cell": "Celda Cibernética",
      "Sign Up": "Registrarse",
      "Home": "Inicio",
      "Logout": "Cerrar sesión",
      "Emergency Flow": "Flujo de Emergencia",
      "Features": "Características",
      "Responder Center": "Centro de Respondedores",
      "Get Protected Now": "Protegerse ahora",
      "Explore Features": "Explorar características",
      "Empowering & Protecting": "Empoderar y Proteger",
      "How it works": "Cómo funciona",
      "Emergency Response Lifecycle": "Ciclo de Respuesta a Emergencias",
      "A secure, multi-layered shield that coordinates community and law enforcement instantly.": "Un escudo seguro y multicapa que coordina a la comunidad y la policía al instante.",
      "Comprehensive Shield": "Escudo Completo",
      "Advanced Safety Features": "Características de Seguridad Avanzadas",
      "More than just a distress button. A complete set of tools to prevent, defend, and document.": "Más que un botón de pánico. Un conjunto completo de herramientas para prevenir, defender y registrar.",
      "Panic SOS Siren": "Sirena de SOS de Pánico",
      "Safe Haven Routing": "Ruta de Refugio Seguro",
      "Check-In Timer": "Temporizador de Control",
      "Fake Call Simulator": "Simulador de Llamada Falsa",
      "Threat Incident Log": "Registro de Amenazas",
      "Hybrid Backend": "Base de datos híbrida",
      "Civilian Access Portal": "Portal de Acceso Civil",
      "Officer Email ID": "ID de Oficial",
      "Passcode": "Contraseña",
      "Login to Control Room": "Ingresar a Control Room",
      "Cyber Officer Email": "Correo de Oficial de Cyber",
      "Access Cyber Desk": "Acceder a Cyber Desk",
      "Create Protected Account": "Crear Cuenta Protegida",
      "Full Name": "Nombre Completo",
      "Email Address": "Correo Electrónico",
      "Password": "Clave",
      "Phone Number (with country code)": "Teléfono (con código de país)",
      "Emergency Password": "Clave de Emergencia",
      "Create Protected Profile": "Crear Perfil Protegido",

      // User Dashboard
      "Women Safety Dashboard": "Tablero de Seguridad",
      "Emergency Trigger": "Gatillo de Emergencia",
      "TAP TO ALERT": "TOCAR PARA ALERTAR",
      "SOS": "SOS",
      "STOP": "ALTO",
      "Tap to send emergency alert": "Tocar para enviar alerta",
      "Silent SOS Mode": "Modo SOS Silencioso",
      "Track location without alarm": "Rastrear ubicación sin alarma",
      "Safety Status": "Estado de Seguridad",
      "Safe": "Seguro",
      "Alert": "Alerta",
      "Emergency": "Emergencia",
      "Safe Check-in Timer": "Temporizador de Control",
      "minutes": "minutos",
      "▶ Start Timer": "▶ Iniciar",
      "✓ Check In": "✓ Registrarse",
      "Auto-SOS if timer expires": "SOS automático si expira",
      "Guardians": "Guardianes",
      "+ Add Guardian": "+ Añadir Guardián",
      "📂 Evidence Upload": "📂 Subir Evidencia",
      "Drag & Drop Files Here": "Arrastre los archivos aquí",
      "or click to browse · Images, Videos, Screenshots, PDFs": "o haga clic para buscar · Imágenes, Videos, PDFs",
      "Upload evidence above to attach to this FIR": "Suba la evidencia arriba para adjuntarla al FIR",
      "Submit FIR": "Enviar FIR",
      "🧾 Write FIR": "🧾 Escribir FIR",
      "🧾 File FIR (First Information Report)": "🧾 Presentar FIR",
      "Police Stations": "Estaciones de Policía",
      "🗺 Nearest Police Stations": "🗺 Estaciones Cercanas",
      "My Location": "Mi Ubicación",
      "Nearby Stations": "Estaciones Cercanas",
      "Click \"My Location\" to find nearest stations.": "Haga clic en \"Mi Ubicación\" para buscar estaciones.",

      // Police Dashboard
      "Police Control Center": "Centro de Control",
      "Live SOS Feed": "Feed de SOS en Vivo",
      "Live Tracking Map": "Mapa de Rastreo",
      "Incident Detail": "Detalle del Incidente",
      "Movement Timeline": "Línea de Tiempo",
      "Incident Tracking Log": "Bitácora de Incidentes",
      "Active SOS": "SOS Activo",
      "Investigating": "Investigando",
      "Resolved": "Resuelto",
      "Total Today": "Total de Hoy",
      "Simulate SOS": "Simular SOS",
      "Fit All Markers": "Ajustar Marcadores",
      "Clear Path Traces": "Limpiar Caminos",

      // Cyber Dashboard
      "Cyber Cell": "Cyber Cell",
      "Case Reports": "Reporte de Casos",
      "Evidence Viewer": "Evidencias",
      "Analytics": "Estadísticas",
      "High Risk Cases": "Casos de Alto Riesgo",
      "File New Report": "Nuevo Reporte",
      "Total Cases": "Casos Totales",
      "Pending": "Pendiente",
      "High Risk": "Alto Riesgo",
      "Clear": "Limpiar",
      "State Filter:": "Filtro de Estado:",
      "Search by name, city, district...": "Buscar por nombre, ciudad, distrito...",
      "All States/UTs": "Todos los Estados/UT"
    },
    gu: {
      // Landing Page / Common
      "One Tap Safety for Women": "મહિલાઓ માટે એક ટેપ સુરક્ષા",
      "Civilian Login": "નાગરિક લૉગિન",
      "Responder Desk": "પ્રત્યુત્તર ડેસ્ક",
      "Cyber Cell": "સાઇબર સેલ",
      "Sign Up": "નોંધણી કરો",
      "Home": "હોમ",
      "Logout": "લૉગ આઉટ",
      "Emergency Flow": "કટોકટી પ્રવાહ",
      "Features": "સુવિધાઓ",
      "Responder Center": "પ્રત્યુત્તર કેન્દ્ર",
      "Get Protected Now": "હવે સુરક્ષિત થાઓ",
      "Explore Features": "સુવિધાઓ અન્વેષણ કરો",
      "Empowering & Protecting": "સશક્ત અને સુરક્ષિત",
      "How it works": "આ કેવી રીતે કામ કરે છે",
      "Emergency Response Lifecycle": "કટોકટી પ્રતિભાવ જીવનચક્ર",
      "A secure, multi-layered shield that coordinates community and law enforcement instantly.": "એક સુરક્ષિત, બહુ-સ્તરીય કવચ જે સમુદાય અને કાયદા અમલીકરણ સાથે તરત સંકલન કરે છે.",
      "Comprehensive Shield": "સર્વગ્રાહી કવચ",
      "Advanced Safety Features": "ઉન્નત સુરક્ષા સુવિધાઓ",
      "More than just a distress button. A complete set of tools to prevent, defend, and document.": "ફક્ત સંકટ બટન કરતાં વધુ. નિવારણ, રક્ષણ અને દસ્તાવેજ માટે સાધનોનો સંપૂર્ણ સેટ.",
      "Panic SOS Siren": "પેનિક SOS સાઇરન",
      "Safe Haven Routing": "સુરક્ષિત આશ્રય માર્ગ",
      "Check-In Timer": "ચેક-ઇન ટાઇમર",
      "Fake Call Simulator": "નકલી કૉલ સિમ્યુલેટર",
      "Threat Incident Log": "ધમકી ઘટના નોંધ",
      "Hybrid Backend": "હાઇબ્રિડ બૅકએન્ડ",
      "Civilian Access Portal": "નાગરિક એક્સેસ પોર્ટલ",
      "Officer Email ID": "અધિકારી ઈ-મેઇલ ID",
      "Passcode": "પાસકોડ",
      "Login to Control Room": "કન્ટ્રોલ રૂમમાં લૉગિન કરો",
      "Cyber Officer Email": "સાઇબર અધિકારી ઈ-મેઇલ",
      "Access Cyber Desk": "સાઇબર ડેસ્ક ખોલો",
      "Create Protected Account": "સુરક્ષિત ખાતું બનાવો",
      "Full Name": "પૂરું નામ",
      "Email Address": "ઈ-મેઇલ સરનામું",
      "Password": "પાસવર્ડ",
      "Phone Number (with country code)": "ફોન નંબર (દેશ કોડ સાથે)",
      "Emergency Password": "કટોકટી પાસવર્ડ",
      "Create Protected Profile": "સુરક્ષિત પ્રોફાઇલ બનાવો",

      // User Dashboard
      "Women Safety Dashboard": "મહિલા સુરક્ષા ડૅશબોર્ડ",
      "Emergency Trigger": "કટોકટી ટ્રિગર",
      "TAP TO ALERT": "ચેતવણી માટે ટૅપ કરો",
      "SOS": "SOS",
      "STOP": "અટકો",
      "Tap to send emergency alert": "કટોકટી ચેતવણી મોકલવા ટૅપ કરો",
      "Silent SOS Mode": "શાંત SOS મોડ",
      "Track location without alarm": "અલાર્મ વગર સ્થાન ટ્રૅક કરો",
      "Safety Status": "સુરક્ષા સ્થિતિ",
      "Safe": "સુરક્ષિત",
      "Alert": "ચેતવણી",
      "Emergency": "કટોકટી",
      "Safe Check-in Timer": "સુરક્ષિત ચેક-ઇન ટાઇમર",
      "minutes": "મિનિટ",
      "▶ Start Timer": "▶ ટાઇમર શરૂ કરો",
      "✓ Check In": "✓ ચેક ઇન",
      "Auto-SOS if timer expires": "ટાઇમર સમાપ્ત થાય ત્યારે ઑટો-SOS",
      "Guardians": "વાલી",
      "+ Add Guardian": "+ વાલી ઉમેરો",
      "📂 Evidence Upload": "📂 પુરાવા અપલોડ",
      "Drag & Drop Files Here": "ફાઇલો અહીં ખેંચો અને છોડો",
      "or click to browse · Images, Videos, Screenshots, PDFs": "અથવા બ્રાઉઝ કરવા ક્લિક કરો · ચિત્રો, વિડિઓ, સ્ક્રીનશૉટ, PDF",
      "Upload evidence above to attach to this FIR": "આ FIR સાથે જોડવા ઉપર પુરાવા અપલોડ કરો",
      "Submit FIR": "FIR સબમિટ કરો",
      "🧾 Write FIR": "🧾 FIR લખો",
      "🧾 File FIR (First Information Report)": "🧾 FIR દાખલ કરો (પ્રથમ માહિતી અહેવાલ)",
      "Police Stations": "પોલીસ સ્ટેશન",
      "🗺 Nearest Police Stations": "🗺 નજીકનાં પોલીસ સ્ટેશન",
      "My Location": "મારું સ્થાન",
      "Nearby Stations": "નજીકનાં સ્ટેશન",
      "Click \"My Location\" to find nearest stations.": "નજીકનાં સ્ટેશન શોધવા \"મારું સ્થાન\" ક્લિક કરો.",

      // Police Dashboard
      "Police Control Center": "પોલીસ નિયંત્રણ કેન્દ્ર",
      "Live SOS Feed": "લાઇવ SOS ફીડ",
      "Live Tracking Map": "લાઇવ ટ્રૅકિંગ નકશો",
      "Incident Detail": "ઘટનાની વિગત",
      "Movement Timeline": "હિલચાલ ટાઇમલાઇન",
      "Incident Tracking Log": "ઘટના ટ્રૅકિંગ લૉગ",
      "Active SOS": "સક્રિય SOS",
      "Investigating": "તપાસ ચાલુ",
      "Resolved": "ઉકેલ્યું",
      "Total Today": "આજનો કુલ",
      "Simulate SOS": "SOS સિમ્યુલેશન",
      "Fit All Markers": "બધા માર્કર ફિટ કરો",
      "Clear Path Traces": "પાથ ટ્રૅસ સાફ કરો",

      // Cyber Dashboard
      "Cyber Cell": "સાઇબર સેલ",
      "Case Reports": "કેસ અહેવાલ",
      "Evidence Viewer": "પુરાવા દર્શક",
      "Analytics": "વિશ્લેષણ",
      "High Risk Cases": "ઉચ્ચ જોખમ કેસ",
      "File New Report": "નવો અહેવાલ નોંધો",
      "Total Cases": "કુલ કેસ",
      "Pending": "પ્રલંબિત",
      "High Risk": "ઉચ્ચ જોખમ",
      "Clear": "સાફ કરો",
      "State Filter:": "રાજ્ય ફિલ્ટર:",
      "Search by name, city, district...": "નામ, શહેર, જિલ્લા દ્વારા શોધો...",
      "All States/UTs": "બધા રાજ્યો/કેન્દ્રશાસિત પ્રદેશો"
    }
  };

  // DOM Translator utility
  function translatePage(lang) {
    if (!dictionary[lang]) return;

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (text) {
          // Store the original text node value on the text node itself
          let origText = node.rakshikaOrigText;
          if (!origText) {
            origText = text;
            node.rakshikaOrigText = origText;
          }

          // Fetch translation
          if (lang === 'en') {
            node.nodeValue = node.nodeValue.replace(text, origText);
          } else if (dictionary[lang][origText]) {
            node.nodeValue = node.nodeValue.replace(text, dictionary[lang][origText]);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        // Skip code execution tags and dynamic dropdowns
        if (tag !== 'script' && tag !== 'style' && tag !== 'select' && tag !== 'option') {
          // Placeholders translation support
          const placeholder = node.getAttribute('placeholder');
          if (placeholder) {
            let origPl = node.getAttribute('data-orig-placeholder');
            if (!origPl) {
              origPl = placeholder;
              node.setAttribute('data-orig-placeholder', origPl);
            }
            if (lang === 'en') {
              node.setAttribute('placeholder', origPl);
            } else if (dictionary[lang][origPl]) {
              node.setAttribute('placeholder', dictionary[lang][origPl]);
            }
          }

          // Recurse children
          node.childNodes.forEach(walk);
        }
      }
    }

    walk(document.body);
    console.log(`Rakshika Translation: Switched page language to "${lang}".`);
  }

  // Inject Language Selector Dropdown dynamically
  function injectLanguageSelector() {
    const container = 
      document.querySelector('.navbar-actions') || 
      document.querySelector('.topbar-right') || 
      document.querySelector('.command-bar-right') ||
      document.body;

    const select = document.createElement('select');
    select.className = 'lang-selector-widget';
    select.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      outline: none;
      font-family: inherit;
      transition: all 0.2s ease;
      margin-right: 12px;
    `;
    select.innerHTML = `
      <option value="en" style="background:#111827;">🇬🇧 English</option>
      <option value="hi" style="background:#111827;">🇮🇳 हिंदी (Hindi)</option>
      <option value="mr" style="background:#111827;">🇮🇳 मराठी (Marathi)</option>
      <option value="gu" style="background:#111827;">🇮🇳 ગુજરાતી (Gujarati)</option>
      <option value="es" style="background:#111827;">🇪🇸 Español</option>
    `;

    // Apply hover states
    select.addEventListener('mouseenter', () => select.style.borderColor = 'rgba(255, 255, 255, 0.35)');
    select.addEventListener('mouseleave', () => select.style.borderColor = 'rgba(255, 255, 255, 0.15)');

    // Bind change event
    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      localStorage.setItem('rakshika_lang', selected);
      translatePage(selected);
      
      // Sync other select instances on the same page (mobile views if any)
      document.querySelectorAll('.lang-selector-widget').forEach(el => {
        if (el.value !== selected) el.value = selected;
      });
    });

    // Determine current language from localStorage and set select option
    const activeLang = localStorage.getItem('rakshika_lang') || 'en';
    select.value = activeLang;

    // Inject into the DOM
    if (container === document.body) {
      // Create a floating top-right bar widget if no structural container exists
      const floatWrap = document.createElement('div');
      floatWrap.style.cssText = 'position:fixed; top:16px; right:16px; z-index:10000;';
      floatWrap.appendChild(select);
      document.body.appendChild(floatWrap);
    } else {
      container.insertBefore(select, container.firstChild);
    }

    // Apply initial translation if language is not English
    if (activeLang !== 'en') {
      // Let content load completely before translating
      setTimeout(() => {
        translatePage(activeLang);
      }, 100);
    }
  }

  // Load handler
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLanguageSelector);
  } else {
    injectLanguageSelector();
  }

})();
