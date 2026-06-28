INSERT INTO users (username, email, password_hash) 
VALUES ('Deshan', 'deshan@example.com', 'hashed_password_here')
RETURNING id;