-- ============================================================
-- WanderLens — Seed Data
-- Run AFTER 001_schema.sql and 002_rls.sql
-- This file is safe to re-run (uses ON CONFLICT DO NOTHING)
-- ============================================================

-- ─── Destinations ───────────────────────────────────────────
INSERT INTO destinations (id, name, region, country, centre, description) VALUES
(
  '11111111-0000-0000-0000-000000000001',
  'Delhi',
  'National Capital Territory',
  'India',
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography,
  'India''s historic capital — a layered city of Mughal grandeur, colonial boulevards, and modern energy. Home to some of the world''s greatest monuments.'
),
(
  '11111111-0000-0000-0000-000000000002',
  'Jaipur',
  'Rajasthan',
  'India',
  ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326)::geography,
  'The Pink City of Rajasthan — a walled city of palaces, forts, and bazaars built by Maharaja Jai Singh II in 1727.'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Monuments — Delhi ──────────────────────────────────────
INSERT INTO monuments (id, destination_id, name, location, built_year, builder, style, history_text, history_version, is_published) VALUES
(
  '22222222-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'Qutub Minar',
  ST_SetSRID(ST_MakePoint(77.1855, 28.5245), 4326)::geography,
  1193,
  'Qutb ud-Din Aibak (Mamluk dynasty)',
  'Indo-Islamic / Early Mughal',
  'Qutub Minar is a soaring 72.5-metre minaret standing in the Qutb complex in Mehrauli, Delhi. Construction began around 1193 under Qutb ud-Din Aibak, founder of the Delhi Sultanate and India''s first Muslim ruler. Successive rulers — Iltutmish and Firuz Shah Tughluq — added storeys and repaired earthquake damage, giving the tower its five distinct tiers of pale buff sandstone and marble. Each storey features a projecting balcony with intricately carved bands of Quranic inscriptions and geometric motifs. The minaret was the tallest in the world when completed. The surrounding Qutb complex, a UNESCO World Heritage Site since 1993, also contains the Alai Darwaza gateway, the 4th-century iron pillar of Chandragupta II (famously rust-free for over 1,600 years), and the ruins of Quwwat-ul-Islam — the first mosque built in India after the Islamic conquest.',
  1,
  TRUE
),
(
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000001',
  'Red Fort',
  ST_SetSRID(ST_MakePoint(77.2410, 28.6562), 4326)::geography,
  1648,
  'Emperor Shah Jahan (Mughal dynasty)',
  'Mughal / Shahjahanabad',
  'The Red Fort (Lal Qila) is a massive Mughal citadel built by Emperor Shah Jahan between 1639 and 1648 as the seat of Mughal power in the newly founded city of Shahjahanabad, present-day Old Delhi. Its name derives from the imposing red sandstone ramparts that stretch 2.5 km around the complex. Inside the walls lie the Diwan-i-Aam (Hall of Public Audience), the Diwan-i-Khas (Hall of Private Audience) with its famous Peacock Throne, and the Rang Mahal palace quarters. At its height, the fort housed over 3,000 residents of the Mughal court. The British captured Delhi in 1857 and used the fort as a military garrison, demolishing many structures. India reclaimed it after independence, and since 1947 the Prime Minister addresses the nation from its ramparts every August 15. It became a UNESCO World Heritage Site in 2007.',
  1,
  TRUE
),
(
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000001',
  'Humayun''s Tomb',
  ST_SetSRID(ST_MakePoint(77.2507, 28.5933), 4326)::geography,
  1572,
  'Hamida Banu Begum (commissioned), Mirak Mirza Ghiyas (architect)',
  'Mughal / Charbagh garden tomb',
  'Humayun''s Tomb, completed in 1572 in Delhi''s Nizamuddin neighbourhood, is the first great Mughal garden tomb on the Indian subcontinent and a UNESCO World Heritage Site since 1993. It was commissioned by Hamida Banu Begum, the wife of the Mughal Emperor Humayun, and designed by the Persian architect Mirak Mirza Ghiyas. The tomb rests on a high platform and rises to a double dome of white marble — a prototype that directly inspired the Taj Mahal a century later. It sits at the centre of a large formal charbagh (four-part garden) divided by water channels symbolising the rivers of paradise described in the Quran. The complex contains over 100 other graves of Mughal royals and nobles. During the 1857 uprising, Bahadur Shah Zafar, the last Mughal emperor, took refuge here before his capture by British forces.',
  1,
  TRUE
),
(
  '22222222-0000-0000-0000-000000000004',
  '11111111-0000-0000-0000-000000000001',
  'India Gate',
  ST_SetSRID(ST_MakePoint(77.2295, 28.6129), 4326)::geography,
  1931,
  'Sir Edwin Lutyens',
  'Triumphant arch / Imperial classical',
  'India Gate is a 42-metre war memorial arch standing at the eastern end of Rajpath (now Kartavya Path) in New Delhi. Designed by Sir Edwin Lutyens and completed in 1931, it commemorates the 70,000 soldiers of the undivided British Indian Army who died in the First World War and the Third Anglo-Afghan War. The names of 13,300 servicemen are engraved on the arch and its foundations. After the 1971 Indo-Pakistani War, an eternal flame known as the Amar Jawan Jyoti was lit beneath the arch to honour the fallen soldiers — this flame burned continuously from 1972 until it was merged with the National War Memorial flame in 2022. The hexagonal surrounding park, with its fountains and lawns, is one of Delhi''s most popular public spaces and the centrepiece of India''s Republic Day parade route.',
  1,
  TRUE
),
(
  '22222222-0000-0000-0000-000000000005',
  '11111111-0000-0000-0000-000000000001',
  'Lotus Temple',
  ST_SetSRID(ST_MakePoint(77.2588, 28.5535), 4326)::geography,
  1986,
  'Fariborz Sahba (architect)',
  'Contemporary / Modernist organic',
  'The Lotus Temple in Bahapur, South Delhi, is the Mother Temple of the Indian subcontinent for the Bahá''í Faith. Designed by Iranian-Canadian architect Fariborz Sahba and completed in 1986, the structure consists of 27 free-standing marble-clad petals arranged in clusters of three, forming nine sides of a lotus flower. The main hall can seat 2,500 worshippers. Open to people of all faiths, it has received over 100 million visitors — making it one of the most-visited buildings in the world — earning it a place in the Guinness World Records. The building is surrounded by nine reflecting pools that give the impression of a lotus floating on water. It has won numerous architectural awards including the Globus d''Or award in 1987.',
  1,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ─── Monuments — Jaipur ─────────────────────────────────────
INSERT INTO monuments (id, destination_id, name, location, built_year, builder, style, history_text, history_version, is_published) VALUES
(
  '22222222-0000-0000-0000-000000000006',
  '11111111-0000-0000-0000-000000000002',
  'Amber Fort',
  ST_SetSRID(ST_MakePoint(75.8514, 26.9855), 4326)::geography,
  1592,
  'Raja Man Singh I (Kachwaha Rajput)',
  'Rajput / Mughal fusion',
  'Amber Fort (Amer Fort) crowns a ridge overlooking Maota Lake on the outskirts of Jaipur, about 11 km from the city centre. Construction was begun in 1592 by Raja Man Singh I of the Kachwaha Rajput clan and expanded significantly by his successors, especially Mirza Raja Jai Singh (1621–67). The fort is a masterpiece of Hindu-Rajput and Mughal architectural fusion: marble and red sandstone blend in its four courtyards, each serving a different ceremonial or residential purpose. The jewel is the Sheesh Mahal (Mirror Palace), whose ceiling is encrusted with thousands of tiny convex mirrors that reflect a single candle flame to create a sky full of stars. Elephants traditionally carried royalty up the steep paved pathway to the Suraj Pol (Sun Gate). Amber Fort is part of the Hill Forts of Rajasthan, a UNESCO World Heritage Site since 2013.',
  1,
  TRUE
),
(
  '22222222-0000-0000-0000-000000000007',
  '11111111-0000-0000-0000-000000000002',
  'Hawa Mahal',
  ST_SetSRID(ST_MakePoint(75.8267, 26.9239), 4326)::geography,
  1799,
  'Maharaja Sawai Pratap Singh',
  'Rajput / Mughal — honeycomb jharokha façade',
  'Hawa Mahal — the Palace of Winds — is Jaipur''s most iconic façade, rising five storeys in the Badi Chaupar section of the walled city. Maharaja Sawai Pratap Singh commissioned it in 1799, and the architect Lal Chand Ustad gave it a form resembling the crown of Lord Krishna. The distinctive honeycomb sandstone screen comprises 953 jharokha (overhanging latticed) windows, originally conceived so the ladies of the royal zenana (women''s quarters) could watch street processions and festivals without being seen from outside. The perforated screen also creates a natural wind channel that keeps the interior cool — giving the palace its name. Only about 1.5 metres deep (it is essentially a large screened wall with corridors behind), the building contains five floors accessible via ramps. The interior holds a small museum with miniature paintings and armour. The monument is inseparable from Jaipur''s identity; its profile appears on most city tourism material.',
  1,
  TRUE
),
(
  '22222222-0000-0000-0000-000000000008',
  '11111111-0000-0000-0000-000000000002',
  'City Palace',
  ST_SetSRID(ST_MakePoint(75.8235, 26.9258), 4326)::geography,
  1729,
  'Maharaja Sawai Jai Singh II',
  'Rajput / Mughal / European blend',
  'The City Palace of Jaipur, constructed between 1729 and 1732 by Maharaja Sawai Jai Singh II, occupies roughly one-seventh of the walled city he founded. The complex is a blend of Rajput, Mughal, and European architectural styles, reflecting the cosmopolitan tastes of its builder who was also a celebrated astronomer. The outermost courtyard, Mubarak Mahal, was used for royal receptions; the Chandra Mahal (still the residence of the royal family) rises seven storeys at the complex''s heart, with each floor decorated in a different colour and style. The palace museum houses one of India''s richest collections of royal textiles, including two enormous sterling silver urns listed in the Guinness World Records as the largest silver objects in the world — Maharaja Madho Singh II had them filled with Ganges water to drink during his 1901 trip to London for King Edward VII''s coronation.',
  1,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ─── Monument Images (placeholder paths — real images uploaded via admin UI) ─
-- Historic/reference images with Wikimedia Commons attribution
INSERT INTO monument_images (id, monument_id, storage_path, kind, source_url, license, author_credit) VALUES
-- Qutub Minar historic image
(
  '33333333-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000001',
  'monuments/qutub-minar/historic-1800s.jpg',
  'historic',
  'https://commons.wikimedia.org/wiki/File:Qutb_Minar_from_Alai_Darwaza_(1858).jpg',
  'Public Domain',
  'Archaeological Survey of India photograph, c. 1858'
),
-- Red Fort historic image
(
  '33333333-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000002',
  'monuments/red-fort/historic-1905.jpg',
  'historic',
  'https://commons.wikimedia.org/wiki/File:Red_Fort_Delhi_India_c1905.jpg',
  'Public Domain',
  'Photograph c. 1905, Library of Congress'
),
-- Humayun Tomb historic image
(
  '33333333-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000003',
  'monuments/humayuns-tomb/historic-1858.jpg',
  'historic',
  'https://commons.wikimedia.org/wiki/File:Humayuns_tomb_1858.jpg',
  'Public Domain',
  'Samuel Bourne, 1858'
),
-- Amber Fort historic image
(
  '33333333-0000-0000-0000-000000000004',
  '22222222-0000-0000-0000-000000000006',
  'monuments/amber-fort/historic-1880s.jpg',
  'historic',
  'https://commons.wikimedia.org/wiki/File:Amber_Fort_1880s.jpg',
  'Public Domain',
  'Photograph c. 1880s, British Library'
),
-- Hawa Mahal historic image
(
  '33333333-0000-0000-0000-000000000005',
  '22222222-0000-0000-0000-000000000007',
  'monuments/hawa-mahal/historic-1890s.jpg',
  'historic',
  'https://commons.wikimedia.org/wiki/File:Hawa_Mahal_Jaipur_1890.jpg',
  'Public Domain',
  'Photograph c. 1890, Wikimedia Commons'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Places — Delhi ─────────────────────────────────────────
INSERT INTO places (id, destination_id, name, category, location, description, avg_rating, n_ratings, is_seeded) VALUES
-- Heritage places
(
  '44444444-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'Agrasen ki Baoli',
  'heritage',
  ST_SetSRID(ST_MakePoint(77.2262, 28.6286), 4326)::geography,
  'A hidden 14th-century stepwell near Connaught Place. 103 steps descend to the water level. Atmospheric and rarely crowded, with moss-covered walls and arched galleries on every level.',
  4.7, 28, TRUE
),
(
  '44444444-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000001',
  'Feroz Shah Kotla',
  'heritage',
  ST_SetSRID(ST_MakePoint(77.2439, 28.6376), 4326)::geography,
  'Ruins of the 14th-century city of Firozabad, built by Sultan Firuz Shah Tughluq. Contains a 3rd-century BC Ashokan pillar still standing in a pyramidal structure. Deeply atmospheric at dusk.',
  4.5, 19, TRUE
),
(
  '44444444-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000001',
  'Hazrat Nizamuddin Dargah',
  'culture',
  ST_SetSRID(ST_MakePoint(77.2486, 28.5934), 4326)::geography,
  'The dargah (shrine) of the 14th-century Sufi saint Nizamuddin Auliya. Free qawwali devotional music every Thursday evening. One of Delhi''s most spiritually charged places.',
  4.8, 42, TRUE
),
-- Food places
(
  '44444444-0000-0000-0000-000000000004',
  '11111111-0000-0000-0000-000000000001',
  'Paranthe Wali Gali',
  'food',
  ST_SetSRID(ST_MakePoint(77.2302, 28.6575), 4326)::geography,
  'A narrow alley in Old Delhi''s Chandni Chowk where families have been frying stuffed paranthas since 1875. Each shop has a different speciality filling. Cash only, no seating.',
  4.6, 35, TRUE
),
(
  '44444444-0000-0000-0000-000000000005',
  '11111111-0000-0000-0000-000000000001',
  'Karim''s, Jama Masjid',
  'food',
  ST_SetSRID(ST_MakePoint(77.2334, 28.6506), 4326)::geography,
  'Legendary Mughlai restaurant operating since 1913 near Jama Masjid. Known for nihari, mutton korma, and seekh kebabs. The original family still runs the kitchen.',
  4.5, 51, TRUE
),
-- Nature/viewpoints
(
  '44444444-0000-0000-0000-000000000006',
  '11111111-0000-0000-0000-000000000001',
  'Sanjay Van',
  'nature',
  ST_SetSRID(ST_MakePoint(77.1957, 28.5403), 4326)::geography,
  'A 780-acre urban forest in South Delhi. Jogging trails, bird watching, ancient baolis, and a medieval tomb hidden among the trees. One of Delhi''s best-kept secrets.',
  4.4, 16, TRUE
),
(
  '44444444-0000-0000-0000-000000000007',
  '11111111-0000-0000-0000-000000000001',
  'Coronation Park',
  'heritage',
  ST_SetSRID(ST_MakePoint(77.1808, 28.7291), 4326)::geography,
  'Site of the three grand Imperial Durbars (1877, 1903, 1911). A lone obelisk and scattered statues of British monarchs stand in an overgrown field — hauntingly empty and undervisited.',
  4.2, 9, TRUE
),
-- Market/culture
(
  '44444444-0000-0000-0000-000000000008',
  '11111111-0000-0000-0000-000000000001',
  'Mehrauli Village',
  'heritage',
  ST_SetSRID(ST_MakePoint(77.1893, 28.5193), 4326)::geography,
  'A living village with layers of history from every Delhi sultanate. Balban''s tomb, Jamali Kamali mosque-and-tomb, and medieval stepwells tucked between tea stalls.',
  4.6, 21, TRUE
),
(
  '44444444-0000-0000-0000-000000000009',
  '11111111-0000-0000-0000-000000000001',
  'Lodi Garden',
  'nature',
  ST_SetSRID(ST_MakePoint(77.2190, 28.5933), 4326)::geography,
  'A 90-acre garden containing the tombs of the Sayyid and Lodi dynasty rulers (15th–16th century). Joggers, couples, and archaeologists share the same lawns at sunrise.',
  4.5, 38, TRUE
),
(
  '44444444-0000-0000-0000-000000000010',
  '11111111-0000-0000-0000-000000000001',
  'Rajon ki Baoli',
  'heritage',
  ST_SetSRID(ST_MakePoint(77.1878, 28.5218), 4326)::geography,
  'A magnificent four-storey stepwell inside Mehrauli Archaeological Park, built in 1516. Completely free, rarely visited, often mistaken for Agrasen ki Baoli by tourists.',
  4.9, 11, TRUE
),

-- ─── Places — Jaipur ────────────────────────────────────────
(
  '44444444-0000-0000-0000-000000000011',
  '11111111-0000-0000-0000-000000000002',
  'Panna Meena ka Kund',
  'heritage',
  ST_SetSRID(ST_MakePoint(75.8501, 26.9849), 4326)::geography,
  'A stunning geometric stepwell near Amber Fort with perfectly symmetrical zig-zag staircases on all four sides. Rarely listed in guidebooks, almost always empty.',
  4.9, 14, TRUE
),
(
  '44444444-0000-0000-0000-000000000012',
  '11111111-0000-0000-0000-000000000002',
  'Galtaji Temple Complex',
  'heritage',
  ST_SetSRID(ST_MakePoint(75.8601, 26.9145), 4326)::geography,
  'A series of Hindu temples, kunds (sacred tanks), and colonnaded pavilions tucked into a natural gorge in the Aravalli hills. Known as the Monkey Temple. Peaceful and photogenic.',
  4.5, 22, TRUE
),
(
  '44444444-0000-0000-0000-000000000013',
  '11111111-0000-0000-0000-000000000002',
  'Nahargarh Fort Sunset Point',
  'viewpoint',
  ST_SetSRID(ST_MakePoint(75.8075, 26.9388), 4326)::geography,
  'The fort itself is known, but the unmarked path to the far western bastion gives a 270° panorama of Jaipur and the Thar Desert at sunset with almost no other tourists.',
  4.8, 17, TRUE
),
(
  '44444444-0000-0000-0000-000000000014',
  '11111111-0000-0000-0000-000000000002',
  'LMB Restaurant',
  'food',
  ST_SetSRID(ST_MakePoint(75.8222, 26.9231), 4326)::geography,
  'Laxmi Misthan Bhandar — a beloved local institution since 1954 in Johari Bazaar. The best dal baati churma and Rajasthani thali in the walled city, favoured by locals over tourists.',
  4.6, 29, TRUE
),
(
  '44444444-0000-0000-0000-000000000015',
  '11111111-0000-0000-0000-000000000002',
  'Sisodiya Rani Garden',
  'nature',
  ST_SetSRID(ST_MakePoint(75.8636, 26.9034), 4326)::geography,
  'A terraced Mughal-style garden built by Sawai Jai Singh II for his queen, on the Agra Road. Multi-tiered fountains, painted pavilions, and almost no tourist crowds.',
  4.4, 13, TRUE
),
(
  '44444444-0000-0000-0000-000000000016',
  '11111111-0000-0000-0000-000000000002',
  'Johari Bazaar Blue Pottery Shops',
  'market',
  ST_SetSRID(ST_MakePoint(75.8219, 26.9215), 4326)::geography,
  'The original artisan workshops for Jaipur''s distinctive turquoise blue pottery made without clay. Several families have maintained the craft for generations. Workshop visits possible.',
  4.3, 18, TRUE
),
(
  '44444444-0000-0000-0000-000000000017',
  '11111111-0000-0000-0000-000000000002',
  'Abhaneri Chand Baori',
  'heritage',
  ST_SetSRID(ST_MakePoint(76.6049, 27.0063), 4326)::geography,
  'One of the largest and most perfectly geometric stepwells in the world, 3500 steps descending 13 stories. Located 95 km from Jaipur. Worth every kilometre of the drive.',
  4.9, 31, TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ─── Seed activity data (sparse — to make some places rank as hidden gems) ──
INSERT INTO place_activity_daily (place_id, date, posts, checkins, likes, comments) VALUES
-- High-activity places (should NOT rank as hidden gems easily)
('44444444-0000-0000-0000-000000000009', CURRENT_DATE - 1,  5, 12, 40, 8),
('44444444-0000-0000-0000-000000000009', CURRENT_DATE - 7,  4,  9, 35, 6),
('44444444-0000-0000-0000-000000000009', CURRENT_DATE - 14, 6, 10, 42, 9),
('44444444-0000-0000-0000-000000000005', CURRENT_DATE - 1,  3,  8, 25, 5),
('44444444-0000-0000-0000-000000000005', CURRENT_DATE - 7,  4,  7, 30, 4),
-- Low-activity hidden gems
('44444444-0000-0000-0000-000000000001', CURRENT_DATE - 5,  0,  1,  2, 0),
('44444444-0000-0000-0000-000000000010', CURRENT_DATE - 10, 0,  1,  1, 0),
('44444444-0000-0000-0000-000000000011', CURRENT_DATE - 3,  0,  1,  3, 0),
('44444444-0000-0000-0000-000000000013', CURRENT_DATE - 8,  1,  2,  4, 1),
('44444444-0000-0000-0000-000000000017', CURRENT_DATE - 6,  1,  2,  5, 1)
ON CONFLICT (place_id, date) DO NOTHING;
