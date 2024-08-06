1. User

   1. id
   2. email
   3. username
   4. password
   5. full_name
   6. role
   7. wallet_balance
   8. profile_image
   9. today_earning
   10. total_earning
   11. jwt_token
   12. reset_password_token
   13. reset_password_token_expiry
   14. signup_method ["google" , "traditional"]
   15. created_at
   16. updated_at

2. Transaction

   1. id
   2. user_id
   3. transaction_type ["deposit", "bet" ,"withdraw"]
   4. amount
   5. status [pending, completed, failed]
   6. created_at
   7. updated_at

3. Game

   1. id
   2. game_time [2pm , 5pm , 9pm]
   3. status [completed , scheduled , cencelled]
   4. winning_number
   5. created_at
   6. updated_at

4. Bet

   1. id
   2. user_id
   3. game_id
   4. choosen_number
   5. bet_amount
   6. is_winner
   7. created_at
   8. updated_at

5. Payout

   1. id
   2. user_id
   3. bet_id
   4. game_id
   5. amount
   6. status ["deposit", "bet" ,"withdraw"]
   7. created_at
   8. updated_at

6. Game Setting

   1. id
   2. max_bet_limit
   3. created_at
   4. updated_at

7. Chatbot Queries

   1. id
   2. user_id
   3. query
   4. response
   5. created_at
   6. updated_at

8. FAQs
   1. id
   2. question
   3. answer
   4. created_at
   5. updated_at
 