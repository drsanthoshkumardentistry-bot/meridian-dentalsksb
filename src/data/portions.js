// Syllabus portions for MeriDent Prep.
// University: subjects of the DCI BDS curriculum by year (check your own university's syllabus for local changes).
// NEET MDS: the same BDS subjects, grouped for revision (MeriDent grouping, not an official blueprint).
// ADC: practice areas for the Australian Dental Council pathway (MeriDent grouping, not the ADC blueprint).
//
// A chapter is a string, or [title, { topic: '<topic slug>', mcq: '<MCQ subject>' }] to link study material.

const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

function subject(key, name, year, mcq, chapters, group = null) {
  return {
    key, name, year, group, mcq,
    chapters: chapters.map((c) => {
      const [title, opts = {}] = Array.isArray(c) ? c : [c]
      return { id: `${key}.${slug(title)}`, title, topic: opts.topic || null, mcq: opts.mcq ?? mcq }
    }),
  }
}

const BDS = [
  // ---------------- 1st year ----------------
  subject('anatomy', 'General Human Anatomy (incl. Embryology & Histology)', 1, 'Anatomy', [
    'Osteology of the skull', 'Mandible and temporomandibular joint', 'Scalp, face and facial nerve',
    'Parotid region and salivary glands', 'Temporal and infratemporal fossae; muscles of mastication',
    'Pterygopalatine fossa and maxillary nerve', 'Mandibular nerve and otic ganglion', 'Submandibular region and lingual nerve',
    'Oral cavity, palate and tongue', 'Pharynx and larynx', 'Nose and paranasal sinuses', 'Triangles of the neck and cervical fascia',
    'Blood supply and lymphatic drainage of head and neck', 'Cranial nerves V, VII, IX and XII',
    'Embryology: pharyngeal arches, face and palate', 'General histology: epithelium, connective tissue, bone, cartilage',
    'Thorax, abdomen and limbs (general overview)',
  ]),
  subject('physio-biochem', 'General Human Physiology & Biochemistry', 1, 'Physiology', [
    'Blood and haemostasis', 'Nerve and muscle physiology', 'Cardiovascular system', 'Respiratory system',
    'Gastrointestinal physiology and saliva', 'Renal physiology and body fluids', 'Endocrine system: pituitary, thyroid, parathyroid, calcium',
    'Central nervous system and physiology of pain', 'Special senses: taste', 'Reproductive physiology (overview)',
    ['Carbohydrate metabolism', { mcq: 'Biochemistry' }], ['Lipid metabolism', { mcq: 'Biochemistry' }],
    ['Proteins and amino acids', { mcq: 'Biochemistry' }], ['Enzymes', { mcq: 'Biochemistry' }], ['Vitamins', { mcq: 'Biochemistry' }],
    ['Minerals: calcium, phosphorus, fluoride', { mcq: 'Biochemistry' }], ['Nucleic acids and molecular biology', { mcq: 'Biochemistry' }],
    ['Acid–base balance', { mcq: 'Biochemistry' }], ['Clinical biochemistry and liver function tests', { mcq: 'Biochemistry' }],
  ]),
  subject('dental-anatomy', 'Dental Anatomy, Embryology & Oral Histology', 1, 'Dental Anatomy', [
    'Development of teeth (odontogenesis)', 'Enamel', 'Dentine', 'Dental pulp', 'Cementum', 'Periodontal ligament', 'Alveolar bone',
    'Oral mucous membrane', 'Salivary glands: histology', 'Eruption and shedding of teeth', 'Temporomandibular joint: histology',
    'Maxillary sinus', 'Chronology of the human dentition', 'Permanent incisors and canines', 'Permanent premolars', 'Permanent molars',
    'Deciduous teeth', 'Occlusion: basic concepts',
  ]),
  // ---------------- 2nd year ----------------
  subject('path-micro', 'General Pathology & Microbiology', 2, 'Pathology', [
    'Cell injury, adaptation and death', 'Inflammation and repair', 'Haemodynamic disorders: thrombosis, embolism, shock',
    'Immunopathology and amyloidosis', 'Neoplasia', 'Genetic disorders', 'Anaemias', 'Leukaemias and lymphomas', 'Bleeding disorders',
    'Diseases of bone (overview)', 'Infectious diseases: tuberculosis, syphilis',
    ['Sterilisation and disinfection', { mcq: 'Microbiology' }], ['Bacterial physiology and genetics', { mcq: 'Microbiology' }],
    ['Immunology and hypersensitivity', { mcq: 'Microbiology' }], ['Staphylococci and streptococci', { mcq: 'Microbiology' }],
    ['Oral flora and dental plaque microbiology', { mcq: 'Microbiology' }], ['Mycobacteria and spirochaetes', { mcq: 'Microbiology' }],
    ['Anaerobes and Actinomyces', { mcq: 'Microbiology' }], ['Viruses: herpes, HIV, hepatitis', { mcq: 'Microbiology' }],
    ['Fungi: Candida', { mcq: 'Microbiology' }], ['Cross-infection control in dentistry', { mcq: 'Microbiology' }],
  ]),
  subject('pharmacology', 'General & Dental Pharmacology & Therapeutics', 2, 'Pharmacology', [
    'General pharmacology: pharmacokinetics and pharmacodynamics', 'Autonomic nervous system drugs',
    ['Local anaesthetics', { topic: 'local-anaesthetics' }], 'General anaesthetics and conscious sedation', ['NSAIDs and analgesics', { topic: 'nsaids' }], 'Opioids',
    'Antimicrobials: principles of use', 'Penicillins, cephalosporins and macrolides', 'Antifungals and antivirals',
    'Haemostatics and anticoagulants', 'Corticosteroids', 'Cardiovascular drugs: antihypertensives, antianginals',
    'Drugs for diabetes and thyroid disease', 'Antiseptics, obtundents and mouthwashes', 'Drugs for emergencies in dental practice',
    'Drug interactions and adverse reactions',
  ]),
  subject('dental-materials', 'Dental Materials', 2, 'Dental Materials', [
    'Structure and properties of dental materials', 'Gypsum products', 'Impression materials: hydrocolloids',
    'Impression materials: elastomers, compound and ZOE', 'Denture base resins', 'Dental waxes', 'Investments and casting procedures',
    'Dental cements: zinc phosphate, ZOE, polycarboxylate', 'Glass ionomer cements', ['Dental amalgam', { topic: 'dental-amalgam' }],
    'Composite resins and bonding agents', 'Direct filling gold', 'Dental casting alloys', 'Dental ceramics',
    ['Biomaterials: calcium silicates and MTA', { topic: 'mta' }], 'Implant materials',
  ]),
  subject('preclinical', 'Pre-clinical Prosthodontics & Conservative Dentistry', 2, null, [
    'Primary and secondary impressions (laboratory steps)', 'Record bases and occlusal rims', 'Articulators and face-bow',
    'Arrangement of artificial teeth', 'Processing, finishing and polishing dentures',
    ['G.V. Black classification and principles of cavity preparation', { mcq: 'Conservative & Endo' }],
    ['Class I and II amalgam preparations', { mcq: 'Conservative & Endo' }], ['Class III and V preparations', { mcq: 'Conservative & Endo' }],
    'Hand instruments and sharpening',
  ]),
  // ---------------- 3rd year ----------------
  subject('medicine', 'General Medicine', 3, 'General Medicine', [
    'Infectious diseases: typhoid, tuberculosis, HIV', 'Cardiovascular: IHD, hypertension, rheumatic heart disease, infective endocarditis',
    'Respiratory: asthma, COPD, pneumonia', 'Haematology: anaemia and bleeding disorders', ['Endocrine: diabetes mellitus and thyroid disease', { topic: 'diabetes-dental' }],
    'Gastrointestinal and liver disease: jaundice, hepatitis', 'Renal disease', 'Neurology: epilepsy, facial palsy, trigeminal neuralgia',
    'Nutrition and vitamin deficiencies', ['Medical emergencies: syncope, anaphylaxis, CPR', { topic: 'adc-anaphylaxis' }],
  ]),
  subject('surgery', 'General Surgery', 3, 'General Surgery', [
    ['Wound healing and surgical infections', { topic: 'wound-healing' }], ['Shock and haemorrhage', { topic: 'shock' }], 'Fluids, electrolytes and blood transfusion', 'Burns',
    'Cysts and tumours: benign and malignant', 'Neck swellings and lymph nodes', 'Thyroid swellings', 'Salivary gland swellings',
    'Oral cancer and neck dissection (overview)', 'Trauma and ATLS principles', 'Sterilisation and asepsis in surgery', 'Tracheostomy',
  ]),
  subject('oral-pathology', 'Oral Pathology & Oral Microbiology', 3, 'Oral Pathology', [
    'Developmental disturbances of teeth', 'Developmental disturbances of oral and paraoral structures',
    ['Odontogenic cysts: inflammatory (radicular cyst)', { topic: 'radicular-cyst' }],
    ['Odontogenic cysts: developmental (OKC, dentigerous)', { topic: 'odontogenic-keratocyst' }],
    ['Odontogenic tumours', { topic: 'ameloblastoma' }], 'Benign tumours of epithelial and connective tissue origin',
    ['Oral squamous cell carcinoma and other malignancies', { topic: 'oral-squamous-cell-carcinoma' }], ['Salivary gland tumours', { topic: 'pleomorphic-adenoma' }], ['Fibro-osseous lesions and bone diseases', { topic: 'fibrous-dysplasia' }],
    'Bacterial, viral and fungal infections', ['Dental caries', { topic: 'dental-caries' }], 'Diseases of the pulp and periapical tissues',
    'Regressive changes: attrition, abrasion, erosion, resorption', 'Physical and chemical injuries', 'Diseases of skin with oral manifestations',
    'Forensic odontology',
  ]),
  // ---------------- Final year ----------------
  subject('oral-medicine', 'Oral Medicine & Radiology', 4, 'Oral Medicine & Radiology', [
    'Case history and clinical examination', ['Red and white lesions; leukoplakia', { topic: 'leukoplakia' }],
    ['Oral submucous fibrosis', { topic: 'osmf' }], ['Lichen planus', { topic: 'oral-lichen-planus' }], ['Vesiculobullous lesions', { topic: 'pemphigus-vulgaris' }],
    'Ulcerative lesions and recurrent aphthae', 'Pigmented lesions', ['Orofacial pain and TMJ disorders', { topic: 'trigeminal-neuralgia' }], 'Salivary gland disorders',
    'Oral manifestations of systemic disease', 'Medically compromised patients', 'Radiation physics and biology', 'Radiation protection',
    'Intraoral radiographic techniques', 'Panoramic and extraoral radiography; CBCT', ['Radiographic interpretation of cysts and tumours', { topic: 'dentigerous-cyst' }],
  ]),
  subject('pedodontics', 'Paediatric & Preventive Dentistry', 4, 'Pedodontics', [
    ['Child psychology and behaviour management', { topic: 'behaviour-management' }], 'Growth and development', 'Dental caries in children and early childhood caries',
    ['Fluorides', { topic: 'fluorides' }], 'Pit and fissure sealants', ['Pulp therapy in primary teeth', { topic: 'pulpotomy-primary' }],
    ['Traumatic injuries to teeth', { topic: 'adc-avulsion' }], ['Space maintainers', { topic: 'space-maintainers' }], 'Oral habits', 'Children with special healthcare needs',
    'Paediatric restorative dentistry and stainless steel crowns', 'Local anaesthesia and sedation in children',
  ]),
  subject('orthodontics', 'Orthodontics & Dentofacial Orthopaedics', 4, 'Orthodontics', [
    'Growth and development of the craniofacial complex', 'Development of dentition and occlusion', ['Classification of malocclusion', { topic: 'angle-classification' }],
    'Aetiology of malocclusion', 'Cephalometrics', 'Diagnosis and treatment planning', 'Biology of tooth movement', 'Removable appliances',
    'Fixed appliances: basics', ['Functional appliances', { topic: 'functional-appliances' }], 'Orthopaedic appliances: headgear, chin cup, RME',
    'Preventive and interceptive orthodontics', 'Retention and relapse', ['Cleft lip and palate', { topic: 'cleft-lip-palate' }],
  ]),
  subject('periodontics', 'Periodontology', 4, 'Periodontics', [
    'Anatomy of the periodontium', 'Classification of periodontal diseases (2017)', 'Dental plaque and calculus',
    'Host response and risk factors', ['Gingival diseases and gingival enlargement', { topic: 'gingival-enlargement' }],
    'Periodontal pocket and bone loss', ['Periodontitis: staging and grading', { topic: 'periodontitis-staging-grading' }], 'Necrotising periodontal diseases',
    'Periodontal–systemic interrelationships', 'Clinical diagnosis and indices', 'Scaling, root planing and instruments',
    'Chemical plaque control', 'Periodontal flap surgery', 'Mucogingival and regenerative surgery', 'Furcation and perio-endo lesions',
    'Dental implants and peri-implantitis', 'Supportive periodontal therapy',
  ]),
  subject('prosthodontics', 'Prosthodontics & Crown and Bridge', 4, 'Prosthodontics', [
    'Edentulous anatomy and diagnosis', ['Complete denture impressions', { topic: 'complete-denture-impressions' }], ['Jaw relations', { topic: 'jaw-relations' }], 'Selection and arrangement of teeth',
    'Try-in, insertion and post-insertion problems', ['Classification of partially edentulous arches', { topic: 'kennedy-classification' }],
    'RPD components and design', 'Fixed partial dentures: abutments and tooth preparation', 'Pontics and connectors',
    'Impressions and gingival retraction', 'Overdentures and immediate dentures', 'Maxillofacial prosthodontics',
    'Implant prosthodontics', 'Occlusion and articulators',
  ]),
  subject('conservative', 'Conservative Dentistry & Endodontics', 4, 'Conservative & Endo', [
    ['Dental caries and caries risk assessment', { topic: 'dental-caries' }], 'Principles of cavity design', 'Amalgam restorations', 'Composite restorations and adhesion',
    'Glass ionomer restorations', 'Pulp protection: liners and bases', 'Cast restorations: inlays and onlays',
    'Pulp and periapical diseases', 'Endodontic access and instruments', ['Cleaning and shaping', { topic: 'root-canal-irrigants' }], ['Obturation', { topic: 'obturation' }],
    ['Vital pulp therapy and MTA', { topic: 'mta' }], 'Endodontic emergencies', 'Traumatic injuries: endodontic management',
    'Bleaching and aesthetic dentistry', 'Endodontic surgery',
  ]),
  subject('oral-surgery', 'Oral & Maxillofacial Surgery', 4, 'Oral Surgery', [
    'Asepsis and sterilisation', ['Local anaesthesia in oral surgery', { topic: 'local-anaesthetics', mcq: 'Pharmacology' }],
    'Principles of exodontia', ['Impacted teeth', { topic: 'impacted-third-molar' }], ['Complications of extraction', { topic: 'dry-socket' }],
    ['Medical emergencies in dental practice', { topic: 'adc-anaphylaxis' }], ['Odontogenic infections and fascial spaces', { topic: 'ludwigs-angina' }],
    'Cysts of the jaws: management', 'Benign and malignant jaw tumours', ['Mandibular fractures', { topic: 'mandibular-fractures' }],
    ['Midface (Le Fort) fractures', { topic: 'le-fort-fractures' }], 'Zygomatic complex fractures', 'TMJ disorders and ankylosis',
    'Pre-prosthetic surgery', 'Orthognathic surgery: basics', 'Maxillary sinus and oro-antral communication', 'Implantology: basics',
  ]),
  subject('public-health', 'Public Health Dentistry', 4, 'Public Health Dentistry', [
    'Concepts of health and disease', 'Epidemiology and study designs', 'Biostatistics', ['Indices: DMFT, CPI, Dean\'s fluorosis index', { topic: 'oral-health-indices' }],
    ['Fluorides and water fluoridation', { topic: 'fluorides' }], 'Preventive dentistry and oral health education', 'Dental public health programmes in India',
    'Health care delivery and dental manpower', 'Ethics and jurisprudence', 'Research methodology',
    'Oral health surveys (WHO methods)', 'Nutrition and oral health',
  ]),
]

const BASIC = new Set(['anatomy', 'physio-biochem', 'dental-anatomy', 'path-micro', 'pharmacology', 'dental-materials', 'medicine', 'surgery'])
const NEET = BDS.filter((s) => s.key !== 'preclinical').map((s) => ({ ...s, group: BASIC.has(s.key) ? 'Basic & medical sciences' : 'Dental sciences' }))

const ADC = [
  subject('adc-emergencies', 'Medical emergencies & medically compromised patients', null, 'Medical emergencies', [
    ['Anaphylaxis', { topic: 'adc-anaphylaxis' }], 'Cardiac emergencies and basic life support', 'Hypoglycaemia and the diabetic patient',
    ['Anticoagulants and bleeding risk', { mcq: 'Therapeutics' }], ['Infective endocarditis prophylaxis', { mcq: 'Therapeutics' }],
    ['Antiresorptive drugs and MRONJ', { mcq: 'Therapeutics' }],
  ], 'Patient safety'),
  subject('adc-ethics', 'Ethics, law & professionalism', null, 'Ethics & law', [
    ['Consent and material risk', { topic: 'adc-consent-notification' }], 'Mandatory notifications and AHPRA',
    'Mature minors and substitute decision-makers', 'Records, privacy and confidentiality',
    'Cultural safety: Aboriginal and Torres Strait Islander oral health', 'Advertising and professional conduct',
  ], 'Patient safety'),
  subject('adc-infection', 'Infection prevention & control', null, 'Infection control', [
    'Standard and transmission-based precautions', 'Spaulding classification and instrument reprocessing', 'Hand hygiene',
    'Sharps injuries and blood-borne viruses', 'Dental unit waterlines and the clinical environment',
  ], 'Patient safety'),
  subject('adc-diagnosis', 'Diagnosis, radiology & oral medicine', null, 'Oral medicine', [
    ['Radiation safety and justification', { mcq: 'Radiology' }], ['Radiographic interpretation', { mcq: 'Radiology' }],
    'Oral mucosal lesions and referral pathways', 'Head and neck cancer detection',
  ], 'Clinical practice'),
  subject('adc-clinical', 'Clinical dentistry in the Australian context', null, null, [
    'Caries management and minimal intervention', ['Endodontic diagnosis and treatment', { mcq: 'Endodontics' }],
    ['Periodontal staging and grading', { mcq: 'Periodontics' }], ['Paediatric dentistry and dental trauma', { topic: 'adc-avulsion', mcq: 'Paediatric dentistry' }],
    ['Fluoride use guidelines (Australia)', { mcq: 'Paediatric dentistry' }], 'Prosthodontics and occlusion', 'Oral surgery and extractions',
    ['Therapeutics and prescribing', { mcq: 'Therapeutics' }], ['Smoking cessation and health promotion', { mcq: 'Public health' }],
  ], 'Clinical practice'),
  subject('adc-practical', 'Practical examination readiness', null, null, [
    'Simulated restorative procedures (cavity and crown preparations)', 'Simulated endodontic procedures',
    'Clinical communication and treatment planning', 'Infection control during clinical procedures',
  ], 'Practical examination'),
]

export const PORTIONS = { University: BDS, 'NEET MDS': NEET, ADC }

export const STATUS = [
  { label: 'Not started', short: '–' },
  { label: 'Read', short: 'R' },
  { label: 'Revised', short: 'Rv' },
  { label: 'Confident', short: '✓' },
]

/** Completion 0–100 for a list of chapters, given { chapterId: 0..3 }. */
export function completion(chapters, statusMap) {
  if (!chapters.length) return 0
  const sum = chapters.reduce((s, c) => s + (statusMap[c.id] || 0), 0)
  return Math.round((sum / (chapters.length * 3)) * 100)
}
