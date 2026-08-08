-- UAT-ONLY demo reviews so the homepage "Loved by Our Customers" rail and the
-- photo-review layout can be seen with content. Do NOT run against live.
-- Text only: photos here must come from real customer uploads via
-- /api/review-image, not stock banner art, or the rail reads as fake.
INSERT INTO reviews (product_sku, user_id, name, rating, review_text, image_url, created_at) VALUES
  ('CC-SI-002', NULL, 'Priya M.', 5,
   'Wore this for my sister''s sangeet and got compliments all evening. The kundan work looks far richer than the price suggests.',
   NULL,
   datetime('now', '-4 days')),
  ('CC-SI-002', NULL, 'Ananya R.', 5,
   'Finish is beautiful and it sits perfectly on the collarbone. Packaging felt like a gift box.',
   NULL,
   datetime('now', '-11 days')),
  ('CC-SI-002', NULL, 'Meera K.', 4,
   'Lovely piece, matte gold exactly as pictured. Took a day longer to arrive than expected but worth the wait.',
   NULL,
   datetime('now', '-19 days')),
  ('CC-SI-002', NULL, 'Divya S.', 5,
   'Second order from Saubhagya. Quality is consistent and the stones have not dulled at all.',
   NULL,
   datetime('now', '-26 days'));
