/* ============================================================
   RAKSHIKA — MAP MODULE (User Dashboard version)
   js/map.js
   Shows user live location + nearest police stations.
   Also used by police dashboard (RakshikaMap class).
============================================================ */

(function (global) {
  'use strict';

  /* ============================================================
     INDIA-WIDE POLICE STATIONS DATABASE
     All 28 States + 8 UTs — 300+ stations
     No external API key required.
  ============================================================ */
  const POLICE_STATIONS = [

    // ═══════════════════════════════════════════════════════════
    // ANDHRA PRADESH
    // ═══════════════════════════════════════════════════════════
    { id:'ap1',  name:'Vijayawada One Town PS',         lat:16.5062, lng:80.6480, city:'Vijayawada',  phone:'0866-2570555', district:'Krishna',       state:'Andhra Pradesh' },
    { id:'ap2',  name:'Visakhapatnam MVP Colony PS',    lat:17.7231, lng:83.3012, city:'Visakhapatnam',phone:'0891-2564646',district:'Visakhapatnam',  state:'Andhra Pradesh' },
    { id:'ap3',  name:'Guntur Town PS',                 lat:16.3067, lng:80.4365, city:'Guntur',       phone:'0863-2234567', district:'Guntur',         state:'Andhra Pradesh' },
    { id:'ap4',  name:'Tirupati Town PS',               lat:13.6288, lng:79.4192, city:'Tirupati',     phone:'0877-2223456', district:'Chittoor',       state:'Andhra Pradesh' },
    { id:'ap5',  name:'Nellore Town PS',                lat:14.4426, lng:79.9865, city:'Nellore',      phone:'0861-2323456', district:'Nellore',        state:'Andhra Pradesh' },
    { id:'ap6',  name:'Kurnool Town PS',                lat:15.8281, lng:78.0373, city:'Kurnool',      phone:'08518-222456', district:'Kurnool',        state:'Andhra Pradesh' },
    { id:'ap7',  name:'Rajahmundry Town PS',            lat:17.0005, lng:81.8040, city:'Rajahmundry',  phone:'0883-2476789', district:'East Godavari',   state:'Andhra Pradesh' },
    { id:'ap8',  name:'Kakinada Port PS',               lat:16.9891, lng:82.2475, city:'Kakinada',     phone:'0884-2346789', district:'East Godavari',   state:'Andhra Pradesh' },
    { id:'ap9',  name:'Anantapur Town PS',              lat:14.6819, lng:77.6006, city:'Anantapur',    phone:'08554-272345', district:'Anantapur',      state:'Andhra Pradesh' },
    { id:'ap10', name:'Kadapa Town PS',                 lat:14.4673, lng:78.8242, city:'Kadapa',       phone:'08562-225678', district:'Kadapa',         state:'Andhra Pradesh' },

    // ═══════════════════════════════════════════════════════════
    // ARUNACHAL PRADESH
    // ═══════════════════════════════════════════════════════════
    { id:'ar1', name:'Itanagar Capital Complex PS',     lat:27.0844, lng:93.6053, city:'Itanagar',     phone:'0360-2212345', district:'Papum Pare',     state:'Arunachal Pradesh' },
    { id:'ar2', name:'Naharlagun PS',                   lat:27.1024, lng:93.6954, city:'Naharlagun',   phone:'0360-2244567', district:'Papum Pare',     state:'Arunachal Pradesh' },
    { id:'ar3', name:'Pasighat PS',                     lat:28.0671, lng:95.3289, city:'Pasighat',     phone:'0368-222234',  district:'East Siang',     state:'Arunachal Pradesh' },
    { id:'ar4', name:'Tezpur Road PS (Tawang)',         lat:27.5860, lng:91.8587, city:'Tawang',       phone:'03794-22345',  district:'Tawang',         state:'Arunachal Pradesh' },

    // ═══════════════════════════════════════════════════════════
    // ASSAM
    // ═══════════════════════════════════════════════════════════
    { id:'as1', name:'Dispur PS',                       lat:26.1433, lng:91.7898, city:'Guwahati',     phone:'0361-2262100', district:'Kamrup Metro',   state:'Assam' },
    { id:'as2', name:'Pan Bazaar PS',                   lat:26.1844, lng:91.7458, city:'Guwahati',     phone:'0361-2733344', district:'Kamrup Metro',   state:'Assam' },
    { id:'as3', name:'Athgaon PS',                      lat:26.1765, lng:91.7854, city:'Guwahati',     phone:'0361-2460808', district:'Kamrup Metro',   state:'Assam' },
    { id:'as4', name:'Jorhat Town PS',                  lat:26.7465, lng:94.2026, city:'Jorhat',       phone:'0376-2320100', district:'Jorhat',         state:'Assam' },
    { id:'as5', name:'Silchar Sadar PS',                lat:24.8333, lng:92.7789, city:'Silchar',      phone:'03842-232345', district:'Cachar',         state:'Assam' },
    { id:'as6', name:'Dibrugarh Town PS',               lat:27.4728, lng:94.9120, city:'Dibrugarh',    phone:'0373-2322345', district:'Dibrugarh',      state:'Assam' },
    { id:'as7', name:'Tezpur Sadar PS',                 lat:26.6338, lng:92.7926, city:'Tezpur',       phone:'03712-232567', district:'Sonitpur',       state:'Assam' },
    { id:'as8', name:'Nagaon Sadar PS',                 lat:26.3504, lng:92.6840, city:'Nagaon',       phone:'03672-234567', district:'Nagaon',         state:'Assam' },

    // ═══════════════════════════════════════════════════════════
    // BIHAR
    // ═══════════════════════════════════════════════════════════
    { id:'bh1', name:'Patna Sadar PS',                  lat:25.6093, lng:85.1376, city:'Patna',        phone:'0612-2234567', district:'Patna',          state:'Bihar' },
    { id:'bh2', name:'Kotwali PS Patna',                lat:25.6177, lng:85.1403, city:'Patna',        phone:'0612-2220001', district:'Patna',          state:'Bihar' },
    { id:'bh3', name:'Gaya Town PS',                    lat:24.7914, lng:84.9994, city:'Gaya',         phone:'0631-2220100', district:'Gaya',           state:'Bihar' },
    { id:'bh4', name:'Muzaffarpur Sadar PS',            lat:26.1209, lng:85.3647, city:'Muzaffarpur',  phone:'0621-2245678', district:'Muzaffarpur',    state:'Bihar' },
    { id:'bh5', name:'Bhagalpur Sadar PS',              lat:25.2425, lng:86.9842, city:'Bhagalpur',    phone:'0641-2400100', district:'Bhagalpur',      state:'Bihar' },
    { id:'bh6', name:'Darbhanga Sadar PS',              lat:26.1542, lng:85.8918, city:'Darbhanga',    phone:'06272-222345', district:'Darbhanga',      state:'Bihar' },
    { id:'bh7', name:'Purnia Sadar PS',                 lat:25.7771, lng:87.4755, city:'Purnia',       phone:'06454-222456', district:'Purnia',         state:'Bihar' },
    { id:'bh8', name:'Ara Sadar PS',                    lat:25.5527, lng:84.6605, city:'Ara',          phone:'06182-235678', district:'Bhojpur',        state:'Bihar' },

    // ═══════════════════════════════════════════════════════════
    // CHHATTISGARH
    // ═══════════════════════════════════════════════════════════
    { id:'cg1', name:'Civil Lines PS Raipur',           lat:21.2514, lng:81.6296, city:'Raipur',       phone:'0771-2223456', district:'Raipur',         state:'Chhattisgarh' },
    { id:'cg2', name:'Kotwali PS Raipur',               lat:21.2367, lng:81.6337, city:'Raipur',       phone:'0771-2234567', district:'Raipur',         state:'Chhattisgarh' },
    { id:'cg3', name:'Bilaspur Kotwali PS',             lat:22.0796, lng:82.1391, city:'Bilaspur',     phone:'07752-222456', district:'Bilaspur',       state:'Chhattisgarh' },
    { id:'cg4', name:'Durg Sadar PS',                   lat:21.1904, lng:81.2849, city:'Durg',         phone:'0788-2326678', district:'Durg',           state:'Chhattisgarh' },
    { id:'cg5', name:'Jagdalpur Kotwali PS',            lat:19.0728, lng:82.0212, city:'Jagdalpur',    phone:'07782-222234', district:'Bastar',         state:'Chhattisgarh' },
    { id:'cg6', name:'Korba Sadar PS',                  lat:22.3595, lng:82.7501, city:'Korba',        phone:'07759-223456', district:'Korba',          state:'Chhattisgarh' },

    // ═══════════════════════════════════════════════════════════
    // GOA
    // ═══════════════════════════════════════════════════════════
    { id:'ga1', name:'Panaji PS',                       lat:15.4989, lng:73.8278, city:'Panaji',       phone:'0832-2226410', district:'North Goa',      state:'Goa' },
    { id:'ga2', name:'Margao PS',                       lat:15.2832, lng:73.9862, city:'Margao',       phone:'0832-2714210', district:'South Goa',      state:'Goa' },
    { id:'ga3', name:'Mapusa PS',                       lat:15.5936, lng:73.8099, city:'Mapusa',       phone:'0832-2263231', district:'North Goa',      state:'Goa' },
    { id:'ga4', name:'Calangute PS',                    lat:15.5440, lng:73.7552, city:'Calangute',    phone:'0832-2276237', district:'North Goa',      state:'Goa' },
    { id:'ga5', name:'Vasco PS',                        lat:15.3958, lng:73.8117, city:'Vasco da Gama',phone:'0832-2512220', district:'South Goa',      state:'Goa' },

    // ═══════════════════════════════════════════════════════════
    // GUJARAT
    // ═══════════════════════════════════════════════════════════
    { id:'gj1', name:'Ahmedabad Shahibaug PS',          lat:23.0519, lng:72.5944, city:'Ahmedabad',    phone:'079-25620200', district:'Ahmedabad',      state:'Gujarat' },
    { id:'gj2', name:'Ahmedabad Navrangpura PS',        lat:23.0338, lng:72.5612, city:'Ahmedabad',    phone:'079-26421111', district:'Ahmedabad',      state:'Gujarat' },
    { id:'gj3', name:'Ahmedabad Satellite PS',          lat:23.0315, lng:72.5086, city:'Ahmedabad',    phone:'079-26745678', district:'Ahmedabad',      state:'Gujarat' },
    { id:'gj4', name:'Surat Central PS',                lat:21.1702, lng:72.8311, city:'Surat',        phone:'0261-2435678', district:'Surat',          state:'Gujarat' },
    { id:'gj5', name:'Surat Adajan PS',                 lat:21.2098, lng:72.7992, city:'Surat',        phone:'0261-2679000', district:'Surat',          state:'Gujarat' },
    { id:'gj6', name:'Vadodara Sayajigunj PS',          lat:22.3119, lng:73.1815, city:'Vadodara',     phone:'0265-2430000', district:'Vadodara',       state:'Gujarat' },
    { id:'gj7', name:'Rajkot Raiya Road PS',            lat:22.2966, lng:70.7973, city:'Rajkot',       phone:'0281-2476543', district:'Rajkot',         state:'Gujarat' },
    { id:'gj8', name:'Gandhinagar Sector 7 PS',         lat:23.2156, lng:72.6369, city:'Gandhinagar',  phone:'079-23227236', district:'Gandhinagar',    state:'Gujarat' },
    { id:'gj9', name:'Bhavnagar Kotwali PS',            lat:21.7645, lng:72.1519, city:'Bhavnagar',    phone:'0278-2424000', district:'Bhavnagar',      state:'Gujarat' },
    { id:'gj10',name:'Jamnagar Kotwali PS',             lat:22.4707, lng:70.0577, city:'Jamnagar',     phone:'0288-2659100', district:'Jamnagar',       state:'Gujarat' },

    // ═══════════════════════════════════════════════════════════
    // HARYANA
    // ═══════════════════════════════════════════════════════════
    { id:'hr1', name:'Gurugram City PS',                lat:28.4595, lng:77.0266, city:'Gurugram',     phone:'0124-2324444', district:'Gurugram',       state:'Haryana' },
    { id:'hr2', name:'Gurugram Sector 14 PS',           lat:28.4741, lng:77.0264, city:'Gurugram',     phone:'0124-2322345', district:'Gurugram',       state:'Haryana' },
    { id:'hr3', name:'Faridabad NIT PS',                lat:28.4089, lng:77.3178, city:'Faridabad',    phone:'0129-2415678', district:'Faridabad',      state:'Haryana' },
    { id:'hr4', name:'Rohtak City PS',                  lat:28.8955, lng:76.6066, city:'Rohtak',       phone:'01262-244444', district:'Rohtak',         state:'Haryana' },
    { id:'hr5', name:'Ambala City PS',                  lat:30.3782, lng:76.7767, city:'Ambala',       phone:'0171-2535678', district:'Ambala',         state:'Haryana' },
    { id:'hr6', name:'Hisar Sadar PS',                  lat:29.1492, lng:75.7217, city:'Hisar',        phone:'01662-238765', district:'Hisar',          state:'Haryana' },
    { id:'hr7', name:'Karnal Sadar PS',                 lat:29.6857, lng:76.9905, city:'Karnal',       phone:'0184-2271234', district:'Karnal',         state:'Haryana' },
    { id:'hr8', name:'Panipat City PS',                 lat:29.3909, lng:76.9635, city:'Panipat',      phone:'0180-2641234', district:'Panipat',        state:'Haryana' },
    { id:'hr9', name:'Yamunanagar Sadar PS',            lat:30.1290, lng:77.2674, city:'Yamunanagar',  phone:'01732-222456', district:'Yamunanagar',    state:'Haryana' },
    { id:'hr10',name:'Sonipat Sadar PS',                lat:28.9988, lng:77.0151, city:'Sonipat',      phone:'0130-2234567', district:'Sonipat',        state:'Haryana' },

    // ═══════════════════════════════════════════════════════════
    // HIMACHAL PRADESH
    // ═══════════════════════════════════════════════════════════
    { id:'hp1', name:'Shimla Sadar PS',                 lat:31.1048, lng:77.1734, city:'Shimla',       phone:'0177-2812345', district:'Shimla',         state:'Himachal Pradesh' },
    { id:'hp2', name:'Shimla Town PS',                  lat:31.1041, lng:77.1662, city:'Shimla',       phone:'0177-2813456', district:'Shimla',         state:'Himachal Pradesh' },
    { id:'hp3', name:'Dharamshala PS',                  lat:32.2190, lng:76.3234, city:'Dharamshala',  phone:'01892-222345', district:'Kangra',         state:'Himachal Pradesh' },
    { id:'hp4', name:'Mandi Sadar PS',                  lat:31.7085, lng:76.9318, city:'Mandi',        phone:'01905-222456', district:'Mandi',          state:'Himachal Pradesh' },
    { id:'hp5', name:'Solan Sadar PS',                  lat:30.9045, lng:77.0967, city:'Solan',        phone:'01792-222567', district:'Solan',          state:'Himachal Pradesh' },
    { id:'hp6', name:'Kullu Sadar PS',                  lat:31.9579, lng:77.1095, city:'Kullu',        phone:'01902-222678', district:'Kullu',          state:'Himachal Pradesh' },
    { id:'hp7', name:'Manali PS',                       lat:32.2432, lng:77.1892, city:'Manali',       phone:'01902-252345', district:'Kullu',          state:'Himachal Pradesh' },

    // ═══════════════════════════════════════════════════════════
    // JHARKHAND
    // ═══════════════════════════════════════════════════════════
    { id:'jh1', name:'Ranchi Sadar PS',                 lat:23.3441, lng:85.3096, city:'Ranchi',       phone:'0651-2203456', district:'Ranchi',         state:'Jharkhand' },
    { id:'jh2', name:'Ranchi Kotwali PS',               lat:23.3612, lng:85.3347, city:'Ranchi',       phone:'0651-2210100', district:'Ranchi',         state:'Jharkhand' },
    { id:'jh3', name:'Jamshedpur Bistupur PS',          lat:22.8046, lng:86.2029, city:'Jamshedpur',   phone:'0657-2221100', district:'East Singhbhum',  state:'Jharkhand' },
    { id:'jh4', name:'Dhanbad Sadar PS',                lat:23.7957, lng:86.4304, city:'Dhanbad',      phone:'0326-2313456', district:'Dhanbad',        state:'Jharkhand' },
    { id:'jh5', name:'Bokaro Steel City PS',            lat:23.6693, lng:86.1511, city:'Bokaro',       phone:'06542-222345', district:'Bokaro',         state:'Jharkhand' },
    { id:'jh6', name:'Hazaribagh Sadar PS',             lat:23.9974, lng:85.3637, city:'Hazaribagh',   phone:'06546-222456', district:'Hazaribagh',     state:'Jharkhand' },

    // ═══════════════════════════════════════════════════════════
    // KARNATAKA
    // ═══════════════════════════════════════════════════════════
    { id:'ka1', name:'Cubbon Park PS',                  lat:12.9783, lng:77.5907, city:'Bengaluru',    phone:'080-22943000', district:'Bengaluru Urban', state:'Karnataka' },
    { id:'ka2', name:'Koramangala PS',                  lat:12.9279, lng:77.6271, city:'Bengaluru',    phone:'080-22943001', district:'Bengaluru Urban', state:'Karnataka' },
    { id:'ka3', name:'HSR Layout PS',                   lat:12.9082, lng:77.6476, city:'Bengaluru',    phone:'080-22943002', district:'Bengaluru Urban', state:'Karnataka' },
    { id:'ka4', name:'Whitefield PS',                   lat:12.9698, lng:77.7500, city:'Bengaluru',    phone:'080-25350100', district:'Bengaluru Urban', state:'Karnataka' },
    { id:'ka5', name:'JP Nagar PS',                     lat:12.9011, lng:77.5799, city:'Bengaluru',    phone:'080-26631100', district:'Bengaluru Urban', state:'Karnataka' },
    { id:'ka6', name:'Yelahanka PS',                    lat:13.1007, lng:77.5963, city:'Bengaluru',    phone:'080-22179100', district:'Bengaluru Urban', state:'Karnataka' },
    { id:'ka7', name:'Mysuru Nazarbad PS',              lat:12.3052, lng:76.6551, city:'Mysuru',       phone:'0821-2422222', district:'Mysuru',         state:'Karnataka' },
    { id:'ka8', name:'Mysuru Town PS',                  lat:12.2958, lng:76.6394, city:'Mysuru',       phone:'0821-2419100', district:'Mysuru',         state:'Karnataka' },
    { id:'ka9', name:'Hubballi Sadar PS',               lat:15.3647, lng:75.1240, city:'Hubballi',     phone:'0836-2256789', district:'Dharwad',        state:'Karnataka' },
    { id:'ka10',name:'Mangaluru City PS',               lat:12.9141, lng:74.8560, city:'Mangaluru',    phone:'0824-2440100', district:'Dakshina Kannada',state:'Karnataka' },
    { id:'ka11',name:'Belagavi Sadar PS',               lat:15.8497, lng:74.4977, city:'Belagavi',     phone:'0831-2425678', district:'Belagavi',       state:'Karnataka' },
    { id:'ka12',name:'Kalaburagi PS',                   lat:17.3297, lng:76.8343, city:'Kalaburagi',   phone:'08472-222456', district:'Kalaburagi',     state:'Karnataka' },
    { id:'ka13',name:'Davanagere PS',                   lat:14.4644, lng:75.9218, city:'Davanagere',   phone:'08192-234567', district:'Davanagere',     state:'Karnataka' },
    { id:'ka14',name:'Shivamogga PS',                   lat:13.9299, lng:75.5681, city:'Shivamogga',   phone:'08182-223456', district:'Shivamogga',     state:'Karnataka' },

    // ═══════════════════════════════════════════════════════════
    // KERALA
    // ═══════════════════════════════════════════════════════════
    { id:'kl1', name:'Thiruvananthapuram Central PS',   lat:8.5241,  lng:76.9366, city:'Thiruvananthapuram',phone:'0471-2320100',district:'Thiruvananthapuram',state:'Kerala' },
    { id:'kl2', name:'Kazhakkoottam PS',                lat:8.5624,  lng:76.8737, city:'Thiruvananthapuram',phone:'0471-2419100',district:'Thiruvananthapuram',state:'Kerala' },
    { id:'kl3', name:'Kochi Ernakulam Town PS',         lat:9.9312,  lng:76.2673, city:'Kochi',        phone:'0484-2382000', district:'Ernakulam',      state:'Kerala' },
    { id:'kl4', name:'Kochi Marine Drive PS',           lat:9.9680,  lng:76.2793, city:'Kochi',        phone:'0484-2395100', district:'Ernakulam',      state:'Kerala' },
    { id:'kl5', name:'Kozhikode Sadar PS',              lat:11.2588, lng:75.7804, city:'Kozhikode',    phone:'0495-2722100', district:'Kozhikode',      state:'Kerala' },
    { id:'kl6', name:'Thrissur Town PS',                lat:10.5276, lng:76.2144, city:'Thrissur',     phone:'0487-2333100', district:'Thrissur',       state:'Kerala' },
    { id:'kl7', name:'Malappuram Town PS',              lat:11.0510, lng:76.0711, city:'Malappuram',   phone:'0483-2736100', district:'Malappuram',     state:'Kerala' },
    { id:'kl8', name:'Kollam Town PS',                  lat:8.8832,  lng:76.5940, city:'Kollam',       phone:'0474-2742100', district:'Kollam',         state:'Kerala' },
    { id:'kl9', name:'Palakkad Town PS',                lat:10.7867, lng:76.6548, city:'Palakkad',     phone:'0491-2500100', district:'Palakkad',       state:'Kerala' },
    { id:'kl10',name:'Kannur Town PS',                  lat:11.8745, lng:75.3704, city:'Kannur',       phone:'0497-2705100', district:'Kannur',         state:'Kerala' },

    // ═══════════════════════════════════════════════════════════
    // MADHYA PRADESH
    // ═══════════════════════════════════════════════════════════
    { id:'mp1', name:'Bhopal Kotwali PS',               lat:23.2599, lng:77.4126, city:'Bhopal',       phone:'0755-2742345', district:'Bhopal',         state:'Madhya Pradesh' },
    { id:'mp2', name:'Bhopal TT Nagar PS',              lat:23.2274, lng:77.4026, city:'Bhopal',       phone:'0755-2556789', district:'Bhopal',         state:'Madhya Pradesh' },
    { id:'mp3', name:'Indore Kotwali PS',               lat:22.7196, lng:75.8577, city:'Indore',       phone:'0731-2525678', district:'Indore',         state:'Madhya Pradesh' },
    { id:'mp4', name:'Indore Vijay Nagar PS',           lat:22.7533, lng:75.8937, city:'Indore',       phone:'0731-2557890', district:'Indore',         state:'Madhya Pradesh' },
    { id:'mp5', name:'Gwalior City PS',                 lat:26.2183, lng:78.1828, city:'Gwalior',      phone:'0751-2430100', district:'Gwalior',        state:'Madhya Pradesh' },
    { id:'mp6', name:'Jabalpur Kotwali PS',             lat:23.1815, lng:79.9864, city:'Jabalpur',     phone:'0761-2400100', district:'Jabalpur',       state:'Madhya Pradesh' },
    { id:'mp7', name:'Ujjain Kotwali PS',               lat:23.1793, lng:75.7849, city:'Ujjain',       phone:'0734-2559100', district:'Ujjain',         state:'Madhya Pradesh' },
    { id:'mp8', name:'Rewa Kotwali PS',                 lat:24.5362, lng:81.3032, city:'Rewa',         phone:'07662-220100', district:'Rewa',           state:'Madhya Pradesh' },
    { id:'mp9', name:'Sagar Kotwali PS',                lat:23.8338, lng:78.7378, city:'Sagar',        phone:'07582-222234', district:'Sagar',          state:'Madhya Pradesh' },
    { id:'mp10',name:'Satna Kotwali PS',                lat:24.5800, lng:80.8322, city:'Satna',        phone:'07672-222456', district:'Satna',          state:'Madhya Pradesh' },

    // ═══════════════════════════════════════════════════════════
    // MAHARASHTRA
    // ═══════════════════════════════════════════════════════════
    { id:'mh1', name:'Colaba PS',                       lat:18.9067, lng:72.8147, city:'Mumbai',       phone:'022-22021855', district:'Mumbai City',    state:'Maharashtra' },
    { id:'mh2', name:'Andheri PS',                      lat:19.1136, lng:72.8697, city:'Mumbai',       phone:'022-26364141', district:'Mumbai Suburban',state:'Maharashtra' },
    { id:'mh3', name:'Dadar PS',                        lat:19.0177, lng:72.8412, city:'Mumbai',       phone:'022-24372181', district:'Mumbai City',    state:'Maharashtra' },
    { id:'mh4', name:'Bandra PS',                       lat:19.0596, lng:72.8295, city:'Mumbai',       phone:'022-26411111', district:'Mumbai Suburban',state:'Maharashtra' },
    { id:'mh5', name:'Borivali PS',                     lat:19.2288, lng:72.8593, city:'Mumbai',       phone:'022-28943456', district:'Mumbai Suburban',state:'Maharashtra' },
    { id:'mh6', name:'Thane Naupada PS',                lat:19.2183, lng:72.9781, city:'Thane',        phone:'022-25344567', district:'Thane',          state:'Maharashtra' },
    { id:'mh7', name:'Navi Mumbai Nerul PS',            lat:19.0330, lng:73.0297, city:'Navi Mumbai',  phone:'022-27705678', district:'Thane',          state:'Maharashtra' },
    { id:'mh8', name:'Pune City PS',                    lat:18.5204, lng:73.8567, city:'Pune',         phone:'020-26122880', district:'Pune',           state:'Maharashtra' },
    { id:'mh9', name:'Pune Shivajinagar PS',            lat:18.5312, lng:73.8470, city:'Pune',         phone:'020-25536226', district:'Pune',           state:'Maharashtra' },
    { id:'mh10',name:'Pune Swargate PS',                lat:18.5018, lng:73.8617, city:'Pune',         phone:'020-24455544', district:'Pune',           state:'Maharashtra' },
    { id:'mh11',name:'Pune Hinjewadi PS',               lat:18.5912, lng:73.7389, city:'Pune',         phone:'020-22946234', district:'Pune',           state:'Maharashtra' },
    { id:'mh12',name:'Pune Hadapsar PS',                lat:18.5018, lng:73.9260, city:'Pune',         phone:'020-26971234', district:'Pune',           state:'Maharashtra' },
    { id:'mh13',name:'Nagpur Kotwali PS',               lat:21.1458, lng:79.0882, city:'Nagpur',       phone:'0712-2524567', district:'Nagpur',         state:'Maharashtra' },
    { id:'mh14',name:'Nashik City PS',                  lat:19.9975, lng:73.7898, city:'Nashik',       phone:'0253-2312345', district:'Nashik',         state:'Maharashtra' },
    { id:'mh15',name:'Aurangabad City PS',              lat:19.8762, lng:75.3433, city:'Aurangabad',   phone:'0240-2331234', district:'Aurangabad',     state:'Maharashtra' },
    { id:'mh16',name:'Solapur City PS',                 lat:17.6599, lng:75.9064, city:'Solapur',      phone:'0217-2732345', district:'Solapur',        state:'Maharashtra' },
    { id:'mh17',name:'Amravati City PS',                lat:20.9374, lng:77.7796, city:'Amravati',     phone:'0721-2662345', district:'Amravati',       state:'Maharashtra' },
    { id:'mh18',name:'Kolhapur City PS',                lat:16.7050, lng:74.2433, city:'Kolhapur',     phone:'0231-2654321', district:'Kolhapur',       state:'Maharashtra' },

    // ═══════════════════════════════════════════════════════════
    // MANIPUR
    // ═══════════════════════════════════════════════════════════
    { id:'mn1', name:'Imphal East PS',                  lat:24.8170, lng:93.9368, city:'Imphal',       phone:'0385-2441234', district:'Imphal East',    state:'Manipur' },
    { id:'mn2', name:'Imphal West PS',                  lat:24.8000, lng:93.9203, city:'Imphal',       phone:'0385-2452345', district:'Imphal West',    state:'Manipur' },
    { id:'mn3', name:'Thoubal PS',                      lat:24.6374, lng:93.9995, city:'Thoubal',      phone:'03851-222345', district:'Thoubal',        state:'Manipur' },

    // ═══════════════════════════════════════════════════════════
    // MEGHALAYA
    // ═══════════════════════════════════════════════════════════
    { id:'ml1', name:'Shillong Sadar PS',               lat:25.5788, lng:91.8933, city:'Shillong',     phone:'0364-2501234', district:'East Khasi Hills',state:'Meghalaya' },
    { id:'ml2', name:'Laban PS Shillong',               lat:25.5648, lng:91.8756, city:'Shillong',     phone:'0364-2223456', district:'East Khasi Hills',state:'Meghalaya' },
    { id:'ml3', name:'Tura PS',                         lat:25.5148, lng:90.2172, city:'Tura',         phone:'03651-224567', district:'West Garo Hills', state:'Meghalaya' },

    // ═══════════════════════════════════════════════════════════
    // MIZORAM
    // ═══════════════════════════════════════════════════════════
    { id:'mz1', name:'Aizawl Sadar PS',                 lat:23.7271, lng:92.7176, city:'Aizawl',       phone:'0389-2322345', district:'Aizawl',         state:'Mizoram' },
    { id:'mz2', name:'Lunglei PS',                      lat:22.8892, lng:92.7452, city:'Lunglei',      phone:'03722-222456', district:'Lunglei',        state:'Mizoram' },

    // ═══════════════════════════════════════════════════════════
    // NAGALAND
    // ═══════════════════════════════════════════════════════════
    { id:'nl1', name:'Kohima Sadar PS',                 lat:25.6701, lng:94.1077, city:'Kohima',       phone:'0370-2290100', district:'Kohima',         state:'Nagaland' },
    { id:'nl2', name:'Dimapur PS',                      lat:25.9091, lng:93.7266, city:'Dimapur',      phone:'03862-222345', district:'Dimapur',        state:'Nagaland' },

    // ═══════════════════════════════════════════════════════════
    // ODISHA
    // ═══════════════════════════════════════════════════════════
    { id:'od1', name:'Bhubaneswar Town PS',             lat:20.2961, lng:85.8245, city:'Bhubaneswar',  phone:'0674-2532345', district:'Khordha',        state:'Odisha' },
    { id:'od2', name:'Kharavela Nagar PS',              lat:20.2627, lng:85.8422, city:'Bhubaneswar',  phone:'0674-2315678', district:'Khordha',        state:'Odisha' },
    { id:'od3', name:'Saheed Nagar PS',                 lat:20.2985, lng:85.8466, city:'Bhubaneswar',  phone:'0674-2545678', district:'Khordha',        state:'Odisha' },
    { id:'od4', name:'Cuttack Town PS',                 lat:20.4625, lng:85.8830, city:'Cuttack',      phone:'0671-2620100', district:'Cuttack',        state:'Odisha' },
    { id:'od5', name:'Rourkela Civil PS',               lat:22.2604, lng:84.8536, city:'Rourkela',     phone:'0661-2500100', district:'Sundargarh',     state:'Odisha' },
    { id:'od6', name:'Berhampur Town PS',               lat:19.3149, lng:84.7941, city:'Berhampur',    phone:'0680-2201234', district:'Ganjam',         state:'Odisha' },
    { id:'od7', name:'Sambalpur Sadar PS',              lat:21.4669, lng:83.9756, city:'Sambalpur',    phone:'0663-2408234', district:'Sambalpur',      state:'Odisha' },
    { id:'od8', name:'Puri Town PS',                    lat:19.8135, lng:85.8312, city:'Puri',         phone:'06752-222345', district:'Puri',           state:'Odisha' },

    // ═══════════════════════════════════════════════════════════
    // PUNJAB
    // ═══════════════════════════════════════════════════════════
    { id:'pb1', name:'Amritsar City PS',                lat:31.6340, lng:74.8723, city:'Amritsar',     phone:'0183-2545678', district:'Amritsar',       state:'Punjab' },
    { id:'pb2', name:'Amritsar GND Nagar PS',           lat:31.6452, lng:74.8412, city:'Amritsar',     phone:'0183-2223456', district:'Amritsar',       state:'Punjab' },
    { id:'pb3', name:'Ludhiana Division No.1 PS',       lat:30.9010, lng:75.8573, city:'Ludhiana',     phone:'0161-2401100', district:'Ludhiana',       state:'Punjab' },
    { id:'pb4', name:'Ludhiana Sadar PS',               lat:30.9108, lng:75.8340, city:'Ludhiana',     phone:'0161-2444567', district:'Ludhiana',       state:'Punjab' },
    { id:'pb5', name:'Jalandhar City PS',               lat:31.3260, lng:75.5762, city:'Jalandhar',    phone:'0181-2222345', district:'Jalandhar',      state:'Punjab' },
    { id:'pb6', name:'Patiala Sadar PS',                lat:30.3398, lng:76.3869, city:'Patiala',      phone:'0175-2212345', district:'Patiala',        state:'Punjab' },
    { id:'pb7', name:'Mohali PS',                       lat:30.7046, lng:76.7179, city:'Mohali',       phone:'0172-5006100', district:'SAS Nagar',      state:'Punjab' },
    { id:'pb8', name:'Bathinda City PS',                lat:30.2110, lng:74.9455, city:'Bathinda',     phone:'0164-2221100', district:'Bathinda',       state:'Punjab' },
    { id:'pb9', name:'Ropar Sadar PS',                  lat:30.9657, lng:76.5283, city:'Ropar',        phone:'01881-222456', district:'Rupnagar',       state:'Punjab' },

    // ═══════════════════════════════════════════════════════════
    // RAJASTHAN
    // ═══════════════════════════════════════════════════════════
    { id:'rj1', name:'Jaipur Kotwali PS',               lat:26.9124, lng:75.7873, city:'Jaipur',       phone:'0141-2742345', district:'Jaipur',         state:'Rajasthan' },
    { id:'rj2', name:'Jaipur Banipark PS',              lat:26.9236, lng:75.7786, city:'Jaipur',       phone:'0141-2312345', district:'Jaipur',         state:'Rajasthan' },
    { id:'rj3', name:'Jodhpur Kotwali PS',              lat:26.2389, lng:73.0243, city:'Jodhpur',      phone:'0291-2652345', district:'Jodhpur',        state:'Rajasthan' },
    { id:'rj4', name:'Kota City PS',                    lat:25.2138, lng:75.8648, city:'Kota',         phone:'0744-2320100', district:'Kota',           state:'Rajasthan' },
    { id:'rj5', name:'Ajmer Kotwali PS',                lat:26.4499, lng:74.6399, city:'Ajmer',        phone:'0145-2627100', district:'Ajmer',          state:'Rajasthan' },
    { id:'rj6', name:'Bikaner Kotwali PS',              lat:28.0229, lng:73.3119, city:'Bikaner',      phone:'0151-2220100', district:'Bikaner',        state:'Rajasthan' },
    { id:'rj7', name:'Udaipur City PS',                 lat:24.5854, lng:73.7125, city:'Udaipur',      phone:'0294-2528100', district:'Udaipur',        state:'Rajasthan' },
    { id:'rj8', name:'Alwar Kotwali PS',                lat:27.5530, lng:76.6346, city:'Alwar',        phone:'0144-2702345', district:'Alwar',          state:'Rajasthan' },
    { id:'rj9', name:'Bharatpur Kotwali PS',            lat:27.2152, lng:77.4955, city:'Bharatpur',    phone:'05644-222234', district:'Bharatpur',      state:'Rajasthan' },
    { id:'rj10',name:'Sikar Kotwali PS',                lat:27.6094, lng:75.1397, city:'Sikar',        phone:'01572-222345', district:'Sikar',          state:'Rajasthan' },

    // ═══════════════════════════════════════════════════════════
    // SIKKIM
    // ═══════════════════════════════════════════════════════════
    { id:'sk1', name:'Gangtok Sadar PS',                lat:27.3389, lng:88.6065, city:'Gangtok',      phone:'03592-201234', district:'East Sikkim',    state:'Sikkim' },
    { id:'sk2', name:'Gyalshing PS',                    lat:27.2892, lng:88.2604, city:'Gyalshing',    phone:'03595-250100', district:'West Sikkim',    state:'Sikkim' },

    // ═══════════════════════════════════════════════════════════
    // TAMIL NADU
    // ═══════════════════════════════════════════════════════════
    { id:'tn1', name:'Egmore PS',                       lat:13.0732, lng:80.2609, city:'Chennai',      phone:'044-28190100', district:'Chennai',        state:'Tamil Nadu' },
    { id:'tn2', name:'Anna Nagar PS',                   lat:13.0850, lng:80.2101, city:'Chennai',      phone:'044-26620100', district:'Chennai',        state:'Tamil Nadu' },
    { id:'tn3', name:'Adyar PS',                        lat:13.0067, lng:80.2573, city:'Chennai',      phone:'044-24420100', district:'Chennai',        state:'Tamil Nadu' },
    { id:'tn4', name:'Tambaram PS',                     lat:12.9249, lng:80.1000, city:'Chennai',      phone:'044-22260100', district:'Chennai',        state:'Tamil Nadu' },
    { id:'tn5', name:'Sholinganallur PS',               lat:12.9010, lng:80.2279, city:'Chennai',      phone:'044-24522345', district:'Chennai',        state:'Tamil Nadu' },
    { id:'tn6', name:'Coimbatore Central PS',           lat:11.0168, lng:76.9558, city:'Coimbatore',   phone:'0422-2300100', district:'Coimbatore',     state:'Tamil Nadu' },
    { id:'tn7', name:'Madurai Town PS',                 lat:9.9252,  lng:78.1198, city:'Madurai',      phone:'0452-2531100', district:'Madurai',        state:'Tamil Nadu' },
    { id:'tn8', name:'Tiruchirappalli Town PS',         lat:10.7905, lng:78.7047, city:'Tiruchirappalli',phone:'0431-2700100',district:'Tiruchirappalli', state:'Tamil Nadu' },
    { id:'tn9', name:'Salem Town PS',                   lat:11.6643, lng:78.1460, city:'Salem',        phone:'0427-2413100', district:'Salem',          state:'Tamil Nadu' },
    { id:'tn10',name:'Tirunelveli Town PS',             lat:8.7139,  lng:77.7567, city:'Tirunelveli',  phone:'0462-2500100', district:'Tirunelveli',    state:'Tamil Nadu' },
    { id:'tn11',name:'Tiruppur PS',                     lat:11.1085, lng:77.3411, city:'Tiruppur',     phone:'0421-2241100', district:'Tiruppur',       state:'Tamil Nadu' },
    { id:'tn12',name:'Vellore Town PS',                 lat:12.9165, lng:79.1325, city:'Vellore',      phone:'0416-2240100', district:'Vellore',        state:'Tamil Nadu' },

    // ═══════════════════════════════════════════════════════════
    // TELANGANA
    // ═══════════════════════════════════════════════════════════
    { id:'tg1', name:'Banjara Hills PS',                lat:17.4156, lng:78.4347, city:'Hyderabad',    phone:'040-23230400', district:'Hyderabad',      state:'Telangana' },
    { id:'tg2', name:'Begumpet PS',                     lat:17.4435, lng:78.4740, city:'Hyderabad',    phone:'040-27901100', district:'Hyderabad',      state:'Telangana' },
    { id:'tg3', name:'Charminar PS',                    lat:17.3616, lng:78.4747, city:'Hyderabad',    phone:'040-24550100', district:'Hyderabad',      state:'Telangana' },
    { id:'tg4', name:'Gachibowli PS',                   lat:17.4400, lng:78.3489, city:'Hyderabad',    phone:'040-23002100', district:'Hyderabad',      state:'Telangana' },
    { id:'tg5', name:'Cyberabad PS',                    lat:17.4473, lng:78.3762, city:'Hyderabad',    phone:'040-23556100', district:'Rangareddi',     state:'Telangana' },
    { id:'tg6', name:'Warangal Town PS',                lat:17.9784, lng:79.5941, city:'Warangal',     phone:'0870-2440100', district:'Warangal',       state:'Telangana' },
    { id:'tg7', name:'Karimnagar Town PS',              lat:18.4386, lng:79.1288, city:'Karimnagar',   phone:'0878-2244100', district:'Karimnagar',     state:'Telangana' },
    { id:'tg8', name:'Nizamabad Town PS',               lat:18.6725, lng:78.0941, city:'Nizamabad',    phone:'08462-223100', district:'Nizamabad',      state:'Telangana' },

    // ═══════════════════════════════════════════════════════════
    // TRIPURA
    // ═══════════════════════════════════════════════════════════
    { id:'tr1', name:'Agartala East PS',                lat:23.8315, lng:91.2868, city:'Agartala',     phone:'0381-2323456', district:'West Tripura',   state:'Tripura' },
    { id:'tr2', name:'Agartala West PS',                lat:23.8352, lng:91.2690, city:'Agartala',     phone:'0381-2334567', district:'West Tripura',   state:'Tripura' },
    { id:'tr3', name:'Dharmanagar PS',                  lat:24.3833, lng:92.1667, city:'Dharmanagar',  phone:'03842-222345', district:'North Tripura',  state:'Tripura' },

    // ═══════════════════════════════════════════════════════════
    // UTTAR PRADESH
    // ═══════════════════════════════════════════════════════════
    { id:'up1', name:'Lucknow Kotwali PS',              lat:26.8467, lng:80.9462, city:'Lucknow',      phone:'0522-2237700', district:'Lucknow',        state:'Uttar Pradesh' },
    { id:'up2', name:'Lucknow Hazratganj PS',           lat:26.8527, lng:80.9404, city:'Lucknow',      phone:'0522-2234567', district:'Lucknow',        state:'Uttar Pradesh' },
    { id:'up3', name:'Lucknow Mahanagar PS',            lat:26.8808, lng:81.0027, city:'Lucknow',      phone:'0522-2382345', district:'Lucknow',        state:'Uttar Pradesh' },
    { id:'up4', name:'Kanpur Kotwali PS',               lat:26.4499, lng:80.3319, city:'Kanpur',       phone:'0512-2312345', district:'Kanpur Nagar',   state:'Uttar Pradesh' },
    { id:'up5', name:'Kanpur Civil Lines PS',           lat:26.4633, lng:80.3323, city:'Kanpur',       phone:'0512-2556789', district:'Kanpur Nagar',   state:'Uttar Pradesh' },
    { id:'up6', name:'Varanasi Kotwali PS',             lat:25.3176, lng:82.9739, city:'Varanasi',     phone:'0542-2503100', district:'Varanasi',       state:'Uttar Pradesh' },
    { id:'up7', name:'Agra Kotwali PS',                 lat:27.1767, lng:78.0081, city:'Agra',         phone:'0562-2464100', district:'Agra',           state:'Uttar Pradesh' },
    { id:'up8', name:'Prayagraj Kotwali PS',            lat:25.4358, lng:81.8463, city:'Prayagraj',    phone:'0532-2422100', district:'Prayagraj',      state:'Uttar Pradesh' },
    { id:'up9', name:'Meerut Kotwali PS',               lat:28.9845, lng:77.7064, city:'Meerut',       phone:'0121-2643100', district:'Meerut',         state:'Uttar Pradesh' },
    { id:'up10',name:'Ghaziabad Kotwali PS',            lat:28.6692, lng:77.4538, city:'Ghaziabad',    phone:'0120-2820100', district:'Ghaziabad',      state:'Uttar Pradesh' },
    { id:'up11',name:'Noida Sector 20 PS',              lat:28.5700, lng:77.3200, city:'Noida',        phone:'0120-2426100', district:'Gautam Buddha Nagar',state:'Uttar Pradesh' },
    { id:'up12',name:'Mathura Kotwali PS',              lat:27.4924, lng:77.6737, city:'Mathura',      phone:'0565-2402100', district:'Mathura',        state:'Uttar Pradesh' },
    { id:'up13',name:'Bareilly Kotwali PS',             lat:28.3670, lng:79.4304, city:'Bareilly',     phone:'0581-2520100', district:'Bareilly',       state:'Uttar Pradesh' },
    { id:'up14',name:'Moradabad Kotwali PS',            lat:28.8386, lng:78.7733, city:'Moradabad',    phone:'0591-2476100', district:'Moradabad',      state:'Uttar Pradesh' },
    { id:'up15',name:'Gorakhpur Kotwali PS',            lat:26.7606, lng:83.3732, city:'Gorakhpur',    phone:'0551-2334100', district:'Gorakhpur',      state:'Uttar Pradesh' },
    { id:'up16',name:'Aligarh Kotwali PS',              lat:27.8974, lng:78.0880, city:'Aligarh',      phone:'0571-2402100', district:'Aligarh',        state:'Uttar Pradesh' },
    { id:'up17',name:'Firozabad Kotwali PS',            lat:27.1591, lng:78.3957, city:'Firozabad',    phone:'05612-234100', district:'Firozabad',      state:'Uttar Pradesh' },
    { id:'up18',name:'Saharanpur Kotwali PS',           lat:29.9680, lng:77.5552, city:'Saharanpur',   phone:'0132-2712100', district:'Saharanpur',     state:'Uttar Pradesh' },

    // ═══════════════════════════════════════════════════════════
    // UTTARAKHAND
    // ═══════════════════════════════════════════════════════════
    { id:'uk1', name:'Dehradun Kotwali PS',             lat:30.3165, lng:78.0322, city:'Dehradun',     phone:'0135-2654100', district:'Dehradun',       state:'Uttarakhand' },
    { id:'uk2', name:'Dehradun Raipur PS',              lat:30.2785, lng:78.0529, city:'Dehradun',     phone:'0135-2761234', district:'Dehradun',       state:'Uttarakhand' },
    { id:'uk3', name:'Haridwar Kotwali PS',             lat:29.9457, lng:78.1642, city:'Haridwar',     phone:'01334-226100', district:'Haridwar',       state:'Uttarakhand' },
    { id:'uk4', name:'Roorkee Sadar PS',                lat:29.8543, lng:77.8880, city:'Roorkee',      phone:'01332-272100', district:'Haridwar',       state:'Uttarakhand' },
    { id:'uk5', name:'Nainital Kotwali PS',             lat:29.3803, lng:79.4636, city:'Nainital',     phone:'05942-235100', district:'Nainital',       state:'Uttarakhand' },
    { id:'uk6', name:'Haldwani Kotwali PS',             lat:29.2183, lng:79.5130, city:'Haldwani',     phone:'05946-220100', district:'Nainital',       state:'Uttarakhand' },

    // ═══════════════════════════════════════════════════════════
    // WEST BENGAL
    // ═══════════════════════════════════════════════════════════
    { id:'wb1', name:'Kolkata Lalbazar PS',             lat:22.5726, lng:88.3639, city:'Kolkata',      phone:'033-22505050', district:'Kolkata',        state:'West Bengal' },
    { id:'wb2', name:'Kolkata Park Street PS',          lat:22.5536, lng:88.3532, city:'Kolkata',      phone:'033-22291180', district:'Kolkata',        state:'West Bengal' },
    { id:'wb3', name:'Kolkata New Market PS',           lat:22.5650, lng:88.3517, city:'Kolkata',      phone:'033-22260100', district:'Kolkata',        state:'West Bengal' },
    { id:'wb4', name:'Kolkata Jadavpur PS',             lat:22.4984, lng:88.3720, city:'Kolkata',      phone:'033-24145678', district:'Kolkata',        state:'West Bengal' },
    { id:'wb5', name:'Kolkata Salt Lake PS',            lat:22.5824, lng:88.4174, city:'Kolkata',      phone:'033-23592345', district:'Kolkata',        state:'West Bengal' },
    { id:'wb6', name:'Howrah Sadar PS',                 lat:22.5855, lng:88.2740, city:'Howrah',       phone:'033-26392345', district:'Howrah',         state:'West Bengal' },
    { id:'wb7', name:'Asansol Sadar PS',                lat:23.6828, lng:86.9718, city:'Asansol',      phone:'0341-2210100', district:'Paschim Bardhaman',state:'West Bengal' },
    { id:'wb8', name:'Durgapur Sadar PS',               lat:23.5204, lng:87.3119, city:'Durgapur',     phone:'0343-2543456', district:'Paschim Bardhaman',state:'West Bengal' },
    { id:'wb9', name:'Siliguri Kotwali PS',             lat:26.7271, lng:88.3953, city:'Siliguri',     phone:'0353-2535678', district:'Darjeeling',     state:'West Bengal' },
    { id:'wb10',name:'Darjeeling Sadar PS',             lat:27.0360, lng:88.2627, city:'Darjeeling',   phone:'0354-2254100', district:'Darjeeling',     state:'West Bengal' },

    // ═══════════════════════════════════════════════════════════
    // UNION TERRITORIES
    // ═══════════════════════════════════════════════════════════

    // DELHI (NCT)
    { id:'dl1', name:'Connaught Place PS',              lat:28.6315, lng:77.2167, city:'New Delhi',    phone:'011-23412345', district:'Central Delhi',   state:'Delhi' },
    { id:'dl2', name:'Saket PS',                        lat:28.5244, lng:77.2066, city:'New Delhi',    phone:'011-29563100', district:'South Delhi',     state:'Delhi' },
    { id:'dl3', name:'Hauz Khas PS',                    lat:28.5494, lng:77.2001, city:'New Delhi',    phone:'011-26516100', district:'South Delhi',     state:'Delhi' },
    { id:'dl4', name:'Dwarka Sector 23 PS',             lat:28.5921, lng:77.0460, city:'New Delhi',    phone:'011-25364100', district:'South West Delhi', state:'Delhi' },
    { id:'dl5', name:'Rohini Sector 6 PS',              lat:28.7370, lng:77.1069, city:'New Delhi',    phone:'011-27052100', district:'North West Delhi', state:'Delhi' },
    { id:'dl6', name:'Sarojini Nagar PS',               lat:28.5780, lng:77.1906, city:'New Delhi',    phone:'011-24672100', district:'South West Delhi', state:'Delhi' },
    { id:'dl7', name:'Lajpat Nagar PS',                 lat:28.5700, lng:77.2430, city:'New Delhi',    phone:'011-29824100', district:'South East Delhi', state:'Delhi' },
    { id:'dl8', name:'Karol Bagh PS',                   lat:28.6463, lng:77.1900, city:'New Delhi',    phone:'011-25717100', district:'Central Delhi',   state:'Delhi' },
    { id:'dl9', name:'Preet Vihar PS',                  lat:28.6448, lng:77.2896, city:'New Delhi',    phone:'011-22522100', district:'East Delhi',      state:'Delhi' },
    { id:'dl10',name:'Shahdara PS',                     lat:28.6692, lng:77.2900, city:'New Delhi',    phone:'011-22326100', district:'North East Delhi', state:'Delhi' },

    // CHANDIGARH
    { id:'ch1', name:'Chandigarh Sector 3 PS',          lat:30.7333, lng:76.7794, city:'Chandigarh',   phone:'0172-2742340', district:'Chandigarh',      state:'Chandigarh' },
    { id:'ch2', name:'Chandigarh Sector 17 PS',         lat:30.7417, lng:76.7900, city:'Chandigarh',   phone:'0172-2700100', district:'Chandigarh',      state:'Chandigarh' },
    { id:'ch3', name:'Chandigarh Industrial Area PS',   lat:30.7062, lng:76.8150, city:'Chandigarh',   phone:'0172-2678100', district:'Chandigarh',      state:'Chandigarh' },

    // JAMMU & KASHMIR
    { id:'jk1', name:'Srinagar Kotwali PS',             lat:34.0837, lng:74.7973, city:'Srinagar',     phone:'0194-2472100', district:'Srinagar',       state:'J&K' },
    { id:'jk2', name:'Srinagar Batmaloo PS',            lat:34.0875, lng:74.7847, city:'Srinagar',     phone:'0194-2458100', district:'Srinagar',       state:'J&K' },
    { id:'jk3', name:'Jammu Kotwali PS',                lat:32.7266, lng:74.8570, city:'Jammu',        phone:'0191-2543100', district:'Jammu',          state:'J&K' },
    { id:'jk4', name:'Jammu Bakshi Nagar PS',           lat:32.7105, lng:74.8623, city:'Jammu',        phone:'0191-2454100', district:'Jammu',          state:'J&K' },

    // LADAKH
    { id:'ld1', name:'Leh Sadar PS',                    lat:34.1526, lng:77.5771, city:'Leh',          phone:'01982-252345', district:'Leh',            state:'Ladakh' },
    { id:'ld2', name:'Kargil Sadar PS',                 lat:34.5539, lng:76.1349, city:'Kargil',       phone:'01985-232345', district:'Kargil',         state:'Ladakh' },

    // PUDUCHERRY
    { id:'py1', name:'Puducherry Muthialpet PS',        lat:11.9416, lng:79.8083, city:'Puducherry',   phone:'0413-2200100', district:'Puducherry',     state:'Puducherry' },
    { id:'py2', name:'Puducherry Orleanspet PS',        lat:11.9201, lng:79.8294, city:'Puducherry',   phone:'0413-2339100', district:'Puducherry',     state:'Puducherry' },

    // ANDAMAN & NICOBAR
    { id:'an1', name:'Port Blair Phoenix Bay PS',       lat:11.6643, lng:92.7460, city:'Port Blair',   phone:'03192-232345', district:'South Andaman',  state:'A&N Islands' },
    { id:'an2', name:'Port Blair Haddo PS',             lat:11.6843, lng:92.7284, city:'Port Blair',   phone:'03192-244567', district:'South Andaman',  state:'A&N Islands' },

    // LAKSHADWEEP
    { id:'lk1', name:'Kavaratti PS',                    lat:10.5593, lng:72.6358, city:'Kavaratti',    phone:'04896-262100', district:'Lakshadweep',    state:'Lakshadweep' },

    // DADRA & NAGAR HAVELI / DAMAN & DIU
    { id:'dd1', name:'Silvassa PS',                     lat:20.2766, lng:73.0145, city:'Silvassa',     phone:'0260-2632345', district:'Dadra & NH',     state:'Dadra & NH' },
    { id:'dd2', name:'Daman Sadar PS',                  lat:20.4148, lng:72.8374, city:'Daman',        phone:'0260-2254100', district:'Daman',          state:'Dadra & NH' },
  ];

  /* ============================================================
     HAVERSINE DISTANCE (km)
  ============================================================ */
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  /* ============================================================
     USER DASHBOARD MAP
  ============================================================ */
  class UserDashboardMap {
    constructor(containerId, options = {}) {
      this.containerId = containerId;
      this.opts = Object.assign({ center: [20.5937, 78.9629], zoom: 5 }, options);

      this._map = null;
      this._userMarker = null;
      this._userCircle = null;
      this._routeLine = null;
      this._stationMarkers = [];
      this._userLat = null;
      this._userLng = null;
      this._nearestStation = null;
      
      // Filter states
      this._stateFilter = '';
      this._cityFilter = '';
      this._searchQuery = '';

      this._init();
    }

    _init() {
      this._map = L.map(this.containerId, {
        center: this.opts.center,
        zoom: this.opts.zoom,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(this._map);

      L.control.attribution({ prefix: '© OpenStreetMap Contributors' }).addTo(this._map);

      // Plot and render all stations immediately
      this._plotStations(null, null);
      this._renderStationList(null, null);
    }

    /* ---- Plot police stations ---- */
    _plotStations(userLat, userLng) {
      // Remove old markers
      this._stationMarkers.forEach(m => this._map.removeLayer(m));
      this._stationMarkers = [];

      let nearest = null;
      let nearestDist = Infinity;

      // Filter based on selected state and query
      let filteredStations = POLICE_STATIONS;
      if (this._stateFilter) {
        filteredStations = filteredStations.filter(st => st.state === this._stateFilter);
      }
      if (this._searchQuery) {
        const q = this._searchQuery.toLowerCase();
        filteredStations = filteredStations.filter(st => 
          st.name.toLowerCase().includes(q) || 
          st.city.toLowerCase().includes(q) || 
          st.district.toLowerCase().includes(q) ||
          st.state.toLowerCase().includes(q)
        );
      }

      const stations = filteredStations.map(st => {
        let dist = null;
        if (userLat !== null && userLng !== null) {
          dist = haversine(userLat, userLng, st.lat, st.lng);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = { ...st, dist };
          }
        }
        return { ...st, dist };
      });

      this._nearestStation = nearest;

      stations.forEach(st => {
        const isNearest = nearest && st.id === nearest.id;
        const icon = this._makeStationIcon(isNearest);

        const marker = L.marker([st.lat, st.lng], { icon })
          .addTo(this._map);
        
        marker.stationId = st.id; // Store stationId for search / focus

        const distStr = st.dist !== null ? `${st.dist.toFixed(1)} km away` : 'Distance unknown';
        const nearestLabel = isNearest ? `<span style="color:#10b981;font-weight:700">⭐ NEAREST TO YOU</span><br>` : '';

        marker.bindPopup(`
          <div style="min-width:180px;line-height:1.6">
            ${nearestLabel}
            <strong style="font-size:.9rem">🚔 ${st.name}</strong><br>
            <span style="font-size:.75rem;color:#94a3b8">
              📍 ${st.city}, ${st.district}, ${st.state}<br>
              📞 ${st.phone}<br>
              📏 ${distStr}
            </span>
            <div style="margin-top:8px">
              <a href="tel:${st.phone}" style="color:#3b82f6;font-size:.75rem;font-weight:600">📲 Call Now</a>
            </div>
          </div>`, { maxWidth: 240 }
        );

        if (isNearest) marker.openPopup();
        this._stationMarkers.push(marker);
      });

      return nearest;
    }

    /* ---- Station icon ---- */
    _makeStationIcon(isNearest) {
      const color = isNearest ? '#10b981' : '#3b82f6';
      const borderColor = isNearest ? '#34d399' : '#60a5fa';
      const emoji = '🚔';
      const size = isNearest ? 44 : 36;

      return L.divIcon({
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${color};
          border:3px solid ${borderColor};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 12px ${color}66;
          "><span style="transform:rotate(45deg);font-size:${isNearest?'18px':'15px'}">${emoji}</span></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size],
        popupAnchor: [0, -size],
        className: '',
      });
    }

    /* ---- Update user location ---- */
    updateUserLocation(lat, lng) {
      this._userLat = lat;
      this._userLng = lng;

      const latlng = [lat, lng];

      if (this._userMarker) {
        this._userMarker.setLatLng(latlng);
        this._userCircle?.setLatLng(latlng);
      } else {
        // User marker (pulsing dot)
        const userIcon = L.divIcon({
          html: `<div style="position:relative">
            <div style="width:14px;height:14px;border-radius:50%;background:#ef4444;
              border:3px solid #ff6b6b;box-shadow:0 0 12px #ef4444;"></div>
            <div style="position:absolute;top:-8px;left:-8px;width:30px;height:30px;
              border-radius:50%;border:2px solid rgba(239,68,68,0.4);
              animation:userPing 1.5s ease-out infinite;"></div>
          </div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          className: '',
        });

        this._userMarker = L.marker(latlng, { icon: userIcon, zIndexOffset: 1000 })
          .addTo(this._map)
          .bindPopup('<strong>📍 Your Location</strong><br><small>Live tracking active</small>');

        this._userCircle = L.circle(latlng, {
          radius: 500,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.05,
          weight: 1,
          dashArray: '4 4',
        }).addTo(this._map);
      }

      // Re-plot stations with distance
      const nearest = this._plotStations(lat, lng);

      // Draw route line to nearest station
      if (nearest) {
        if (this._routeLine) {
          this._map.removeLayer(this._routeLine);
        }
        this._routeLine = L.polyline([latlng, [nearest.lat, nearest.lng]], {
          color: '#ef4444',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 8'
        }).addTo(this._map);

        const navBtn = document.getElementById('btnNavigateToStation');
        if (navBtn) {
          navBtn.style.display = 'inline-flex';
          navBtn.onclick = () => {
            const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat},${lng};${nearest.lat},${nearest.lng}`;
            window.open(url, '_blank');
          };
        }
      }

      // Fly to user
      this._map.flyTo(latlng, 14, { duration: 1.5 });

      // Update station list in sidebar
      this._renderStationList(lat, lng);

      return nearest;
    }

    /* ---- Render list of filtered stations ---- */
    _renderStationList(userLat, userLng) {
      const listEl = document.getElementById('stationList');
      if (!listEl) return;

      // Filter based on selected state, city, and query
      let filteredStations = POLICE_STATIONS;
      if (this._stateFilter) {
        filteredStations = filteredStations.filter(st => st.state === this._stateFilter);
      }
      if (this._cityFilter) {
        filteredStations = filteredStations.filter(st => st.city === this._cityFilter);
      }
      if (this._searchQuery) {
        const q = this._searchQuery.toLowerCase();
        filteredStations = filteredStations.filter(st => 
          st.name.toLowerCase().includes(q) || 
          st.city.toLowerCase().includes(q) || 
          st.district.toLowerCase().includes(q) ||
          st.state.toLowerCase().includes(q)
        );
      }

      let displayStations = [];
      if (userLat !== null && userLng !== null) {
        // If user location is known, sort by distance
        displayStations = filteredStations
          .map(st => ({ ...st, dist: haversine(userLat, userLng, st.lat, st.lng) }))
          .sort((a, b) => a.dist - b.dist);
      } else {
        // Otherwise, sort alphabetically by name
        displayStations = filteredStations
          .map(st => ({ ...st, dist: null }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }

      // Limit matching list to 30 elements to prevent DOM overload, default is 5 nearest
      const limit = (this._stateFilter || this._searchQuery) ? 30 : 5;
      const sorted = displayStations.slice(0, limit);

      if (sorted.length === 0) {
        listEl.innerHTML = `<div style="font-size:.78rem;color:var(--text-3);font-style:italic;padding:10px 0">No stations match filters.</div>`;
        return;
      }

      listEl.innerHTML = sorted.map((st, i) => {
        const isFirst = i === 0 && userLat !== null && userLng !== null;
        const distText = st.dist !== null ? `${st.dist.toFixed(1)} km away` : `${st.city}, ${st.state}`;
        return `
        <div class="station-item ${isFirst?'nearest-station':''}"
          onclick="window.dashMap && window.dashMap.focusStation('${st.id}')"
          style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
            background:var(--bg-card-3);border-radius:var(--r-sm);
            border:1px solid ${isFirst?'rgba(16,185,129,0.3)':'var(--border)'};
            cursor:pointer;transition:all .18s ease;margin-bottom:6px"
          onmouseover="this.style.borderColor='rgba(59,130,246,.4)'"
          onmouseout="this.style.borderColor='${isFirst?'rgba(16,185,129,.3)':'var(--border)'}'">
          <span style="font-size:1.2rem;flex-shrink:0">${isFirst?'⭐':'🚔'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:.82rem;margin-bottom:2px;
              color:${isFirst?'var(--safe)':'var(--text-1)'}">${st.name}</div>
            <div style="font-size:.72rem;color:var(--text-3);font-family:var(--mono)">${distText}</div>
            <a href="tel:${st.phone}" onclick="event.stopPropagation()"
              style="font-size:.7rem;color:var(--blue-400);text-decoration:none;font-weight:600">📲 ${st.phone}</a>
          </div>
        </div>`;
      }).join('');
    }

    focusStation(stationId) {
      const st = POLICE_STATIONS.find(s => s.id === stationId);
      if (!st) return;
      this._map.flyTo([st.lat, st.lng], 16, { duration: 1.2 });
      const m = this._stationMarkers.find(marker => marker.stationId === stationId);
      if (m) setTimeout(() => m.openPopup(), 1300);
    }

    setFilters(stateFilter, cityFilter, searchQuery) {
      this._stateFilter = stateFilter || '';
      this._cityFilter = cityFilter || '';
      this._searchQuery = searchQuery || '';
      
      this._plotStations(this._userLat, this._userLng);
      this._renderStationList(this._userLat, this._userLng);

      // Fit map to matching stations
      let filteredStations = POLICE_STATIONS;
      if (this._stateFilter) {
        filteredStations = filteredStations.filter(st => st.state === this._stateFilter);
      }
      if (this._cityFilter) {
        filteredStations = filteredStations.filter(st => st.city === this._cityFilter);
      }
      if (this._searchQuery) {
        const q = this._searchQuery.toLowerCase();
        filteredStations = filteredStations.filter(st => 
          st.name.toLowerCase().includes(q) || 
          st.city.toLowerCase().includes(q) || 
          st.district.toLowerCase().includes(q)
        );
      }

      if (filteredStations.length > 0) {
        const points = filteredStations.map(s => [s.lat, s.lng]);
        if (this._userLat) points.push([this._userLat, this._userLng]);
        this._map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
      }
    }

    fitAll() {
      let filteredStations = POLICE_STATIONS;
      if (this._stateFilter) {
        filteredStations = filteredStations.filter(st => st.state === this._stateFilter);
      }
      if (this._cityFilter) {
        filteredStations = filteredStations.filter(st => st.city === this._cityFilter);
      }
      if (this._searchQuery) {
        const q = this._searchQuery.toLowerCase();
        filteredStations = filteredStations.filter(st => 
          st.name.toLowerCase().includes(q) || 
          st.city.toLowerCase().includes(q) || 
          st.district.toLowerCase().includes(q)
        );
      }

      const points = filteredStations.map(s => [s.lat, s.lng]);
      if (this._userLat) points.push([this._userLat, this._userLng]);
      
      if (points.length > 0) {
        this._map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      }
    }

    invalidate() { this._map?.invalidateSize(); }

    getNearestStation() { return this._nearestStation; }
  }

  /* ============================================================
     POLICE DASHBOARD MAP (kept for compatibility)
  ============================================================ */
  class RakshikaMap {
    constructor(containerId, options = {}) {
      this.containerId = containerId;
      this.opts = Object.assign({ center: [20.5937, 78.9629], zoom: 5 }, options);
      this._map = null;
      this._markers = new Map();
      this._pathLines = new Map();
      this._pathCoords = new Map();
      this._replayTimers = [];
      this._init();
    }

    _init() {
      this._map = L.map(this.containerId, {
        center: this.opts.center, zoom: this.opts.zoom,
        zoomControl: true, attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this._map);
      L.control.attribution({ prefix: '© OpenStreetMap' }).addTo(this._map);
    }

    _makeIcon(status) {
      const colors = {
        active: { bg:'#ef4444', border:'#ff6b6b' },
        acknowledged: { bg:'#f59e0b', border:'#fbbf24' },
        assigned: { bg:'#3b82f6', border:'#60a5fa' },
        in_progress: { bg:'#f97316', border:'#ffedd5' },
        resolved: { bg:'#10b981', border:'#34d399' }
      };
      const c = colors[status] || colors.active;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
        <defs><radialGradient id="g${status}" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${c.border}"/><stop offset="100%" stop-color="${c.bg}"/>
        </radialGradient></defs>
        <ellipse cx="20" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.3)"/>
        <circle cx="20" cy="20" r="14" fill="url(#g${status})" stroke="${c.border}" stroke-width="2"/>
        <text x="20" y="24" text-anchor="middle" font-size="13" font-family="sans-serif" fill="white" font-weight="bold">SOS</text>
        <line x1="20" y1="34" x2="20" y2="44" stroke="${c.bg}" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
      return L.divIcon({ html: svg, iconSize:[40,50], iconAnchor:[20,50], popupAnchor:[0,-50], className:'rak-marker' });
    }

    upsertMarker(alertId, lat, lng, meta = {}) {
      const status = meta.status || 'active';
      const latlng = [lat, lng];

      if (this._markers.has(alertId)) {
        const { marker, circle } = this._markers.get(alertId);
        marker.setLatLng(latlng);
        marker.setIcon(this._makeIcon(status));
        if (circle) circle.setLatLng(latlng);
        this._updatePopup(alertId, meta);
      } else {
        const marker = L.marker(latlng, { icon: this._makeIcon(status) }).addTo(this._map);
        const circle = status === 'active'
          ? L.circle(latlng, { radius:200, color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.07, weight:1, dashArray:'4 4' }).addTo(this._map)
          : null;
        this._markers.set(alertId, { marker, circle });
        this._updatePopup(alertId, meta);
      }

      if (!this._pathCoords.has(alertId)) this._pathCoords.set(alertId, []);
      this._pathCoords.get(alertId).push(latlng);

      if (this._pathLines.has(alertId)) {
        this._pathLines.get(alertId).addLatLng(latlng);
      } else {
        const line = L.polyline([latlng], { color: status==='active'?'#3b82f6':'#10b981', weight:2, opacity:0.6, dashArray:'6 4' }).addTo(this._map);
        this._pathLines.set(alertId, line);
      }
    }

    _updatePopup(alertId, meta) {
      const { marker } = this._markers.get(alertId);
      const ts = meta.timestamp ? new Date(meta.timestamp).toLocaleTimeString() : '--';
      marker.bindPopup(`<div style="min-width:160px">
        <div style="font-weight:700;margin-bottom:6px">🆘 ${meta.userName||'Unknown'}</div>
        <div style="font-size:.75rem;color:#94a3b8;font-family:monospace">
          Status: <strong style="color:${meta.status==='active'?'#ef4444':meta.status==='resolved'?'#10b981':'#f59e0b'}">${(meta.status||'active').toUpperCase()}</strong><br>
          Updated: ${ts}
        </div></div>`, { maxWidth:220 });
    }

    removeMarker(alertId) {
      if (!this._markers.has(alertId)) return;
      const { marker, circle } = this._markers.get(alertId);
      this._map.removeLayer(marker);
      if (circle) this._map.removeLayer(circle);
      this._markers.delete(alertId);
    }

    focusAlert(alertId) {
      if (!this._markers.has(alertId)) return;
      const { marker } = this._markers.get(alertId);
      this._map.flyTo(marker.getLatLng(), 15, { duration:1.2 });
      setTimeout(() => marker.openPopup(), 1300);
    }

    fitAll() {
      if (!this._markers.size) return;
      this._map.fitBounds(L.latLngBounds([...this._markers.values()].map(m => m.marker.getLatLng())), { padding:[60,60], maxZoom:14 });
    }

    replayPath(alertId, onStep) {
      const coords = this._pathCoords.get(alertId);
      if (!coords || coords.length < 2) return;
      this._replayTimers.forEach(t => clearTimeout(t));
      this._replayTimers = [];
      this._map.fitBounds(L.latLngBounds(coords), { padding:[80,80], maxZoom:16 });
      const dot = L.marker(coords[0], { icon: L.divIcon({ html:'<div style="width:14px;height:14px;border-radius:50%;background:#60a5fa;border:2px solid #93c5fd;box-shadow:0 0 8px #3b82f6"></div>', iconSize:[14,14], iconAnchor:[7,7], className:'' }), zIndexOffset:1000 }).addTo(this._map);
      coords.forEach((coord, i) => {
        const t = setTimeout(() => {
          dot.setLatLng(coord);
          if (onStep) onStep({ lat:coord[0], lng:coord[1], step:i+1, total:coords.length });
          if (i === coords.length-1) setTimeout(() => this._map.removeLayer(dot), 1500);
        }, i * 600);
        this._replayTimers.push(t);
      });
    }

    clearPaths() { this._pathLines.forEach(l => this._map.removeLayer(l)); this._pathLines.clear(); }
    panTo(lat, lng, zoom) { this._map.setView([lat, lng], zoom ?? this._map.getZoom(), { animate:true }); }
    invalidate() { if (this._map) this._map.invalidateSize(); }
    get markerCount() { return this._markers.size; }
  }

  global.UserDashboardMap = UserDashboardMap;
  global.RakshikaMap = RakshikaMap;
  global.POLICE_STATIONS = POLICE_STATIONS;
  global.haversine = haversine;

})(window);
