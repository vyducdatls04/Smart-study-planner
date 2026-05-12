import { db } from "../config/db.js";

db.query(`
INSERT INTO users (name,email,password)
VALUES ('Dat','dat@gmail.com','123456')
`);

db.query(`
INSERT INTO subjects (user_id,name,color) VALUES
(1,'Lập trình Web','#E5F0F7'),
(1,'Tiếng Trung','#F6EFD7')
`);

db.query(`
INSERT INTO tasks (user_id,title,deadline,status,priority,progress) VALUES
(1,'Học React','2026-04-07','completed','high',100),
(1,'Học HSK3','2026-04-08','in-progress','medium',60),
(1,'Làm SQL','2026-04-09','pending','high',0)
`);