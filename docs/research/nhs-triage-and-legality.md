# NHS triage logic and UK legality — research

A note tying it together: NHS Pathways is itself a Class 1 medical device and is licensed, not reusable. Replicating its mechanic (symptom to branching questions to care recommendation) plus monitoring and emotion inference is exactly what triggers the regulatory obligations below. The "we do not diagnose" disclaimer alone does not keep the app out of scope. Design accordingly: wellbeing logging and generic signposting where the user keeps the decision.

## NHS 111 / NHS Pathways model (to emulate, not copy)
Symptom-based, not diagnostic. Entry module screens for life-threatening problems first. Each answer determines the next question until an endpoint. Output is a "disposition" (care level plus time frame) mapped to local services. Owned by DHSC, delivered by NHS England, licensed. https://digital.nhs.uk/services/nhs-pathways ; https://digital.nhs.uk/services/nhs-pathways/nhs-pathways-is-a-class-1-medical-device

We reuse the NHS.uk three-tier wording (999/A&E, then urgent GP or 111, then routine GP) and the public-domain instruments below. We do not reuse Pathways' algorithms.

## PHQ-9 (depression, public domain)
Stem: "Over the last 2 weeks, how often have you been bothered by any of the following problems?" Each item: Not at all 0, Several days 1, More than half the days 2, Nearly every day 3.
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling or staying asleep, or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself, or that you are a failure or have let yourself or your family down
7. Trouble concentrating on things, such as reading the newspaper or watching television
8. Moving or speaking so slowly that other people could have noticed, or the opposite, being so fidgety or restless that you have been moving around a lot more than usual
9. Thoughts that you would be better off dead, or of hurting yourself in some way

Total 0-27. Bands: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe.
Hard safety branch: item 9 score of 1 or more triggers the self-harm pathway regardless of total. Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC1495268/ ; https://en.wikipedia.org/wiki/PHQ-9

## GAD-7 (anxiety)
Same stem and 0-3 scale.
1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless that it is hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid, as if something awful might happen

Total 0-21. Bands: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe. Threshold for further assessment is 10 or more. https://pmc.ncbi.nlm.nih.gov/articles/PMC6691128/

## SOCRATES (symptom history)
Site (where, can you point), Onset (when, sudden or gradual, what were you doing), Character (sharp, dull, burning, stabbing, throbbing, crushing), Radiation (does it spread), Associations (nausea, vomiting, sweating, breathlessness, fever), Time course (constant or intermittent, worse at any time, how long), Exacerbating and relieving (movement, rest, position, food, meds), Severity (0-10 plus impact on function and sleep). https://geekymedics.com/the-socrates-acronym-in-history-taking/

## WHO-5 wellbeing
Stem "Over the past two weeks", scale 5 all of the time down to 0 at no time.
1. I have felt cheerful and in good spirits
2. I have felt calm and relaxed
3. I have felt active and vigorous
4. I woke up feeling fresh and rested
5. My daily life has been filled with things that interest me
Raw 0-25, multiply by 4 for 0-100. Screen for low mood if raw 13 or below, or any item 0-1. Positively framed, so invert the logic versus PHQ-9. https://www.psytoolkit.org/survey-library/who5.html

## mMRC breathlessness (0-4)
0 breathless only with strenuous exercise. 1 short of breath hurrying or up a slight hill. 2 walks slower than peers or stops for breath at own pace. 3 stops after ~100 m or a few minutes. 4 too breathless to leave the house or when dressing. https://www.pcrs-uk.org/mrc-dyspnoea-scale

## NEWS2 (clinical only)
Needs measured vitals; not for patient self-completion. Gate behind a clinician flow if used. https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/

## Red flags (NHS.uk verbatim, route to 999)
Chest pain: sudden pain that does not go away (squeezing, pressure, burning); pain spreading to arm, neck, jaw, stomach, or back; chest pain with sweating, nausea, light-headedness, or shortness of breath. https://www.nhs.uk/conditions/heart-attack/symptoms/
Shortness of breath: severe difficulty breathing (gasping, choking, cannot get words out); tight or heavy chest; pain spreading to arms, back, neck, jaw; lips or skin turning pale, blue, or grey; sudden confusion. https://www.nhs.uk/symptoms/shortness-of-breath/
Headache: with seizure, numbness or weakness, sudden and extremely painful (thunderclap), recent head injury, difficulty speaking or walking, drowsy or confused, loss of vision, non-fading rash, very high temperature with stiff neck or light hurting the eyes. https://www.nhs.uk/symptoms/headaches/
Low mood: 999 or A&E if life at risk or serious self-harm; 111 for urgent help; GP if low mood lasts 2 weeks or more. Samaritans 116 123. https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/low-mood-sadness-depression/

## HPC structure GPs use
Presenting complaint, history of presenting complaint (SOCRATES), past medical history, drug history, allergies, family history, social history, systems review, and ideas/concerns/expectations.

## UK legality (be exact)
- Medical device line. UK MDR 2002 includes software intended for diagnosis, prevention, monitoring, treatment, or alleviation of disease. Test is intended purpose, judged from labelling and marketing. MHRA lists "triage", "symptom checker", "predicts", "risk of", "screening" as device-indicator words. Disclaimers do not override medical claims made elsewhere. If in scope, Class I needs UKCA mark plus MHRA registration; decision-support driving diagnosis can be Class IIa. https://www.gov.uk/guidance/regulating-medical-devices-in-the-uk
- UK GDPR and DPA 2018. Health data is special category (Art 9). Need an Art 6 basis plus Art 9 condition; for a consumer app that is explicit consent (Art 9(2)(a)), unbundled and withdrawable. DPIA effectively mandatory here (special-category plus biometric plus systematic monitoring). Store derived features, not raw audio or video. ICO is openly sceptical of emotion AI.
- NHS standards if integrating. DCB0129/DCB0160 clinical safety (Clinical Safety Officer, hazard log, safety case), DTAC, NICE Evidence Standards Framework (a triage tree that drives management is Tier C, the most evidence-demanding).
- EU AI Act. Art 5(1)(f) prohibits emotion inference in workplace and education. Other emotion recognition is high-risk under Annex III, with a transparency duty under Art 50. UK-only deployment is not directly bound but it is the benchmark for any EU exposure.

Sources for legality: MHRA stand-alone software guidance, ICO special-category and biometric guidance, NICE ESF, artificialintelligenceact.eu (verify against EUR-Lex for formal use).
