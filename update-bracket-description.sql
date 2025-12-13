-- Update bracket play description with correct seeding
UPDATE tournaments
SET bracket_play_description = '4 Teams of 6 Players
Seeds 1+12+7, 2+11+8, 3+9+6, 4+10+5
Balanced Team Formation
Top, bottom, and middle seeds combined
Double Elimination
Everyone must lose twice to be eliminated'
WHERE id = 6;
