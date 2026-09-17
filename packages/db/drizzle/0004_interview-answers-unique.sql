-- Custom SQL migration file, put your code below! --
CREATE UNIQUE INDEX `interview_answers_question_id_unique` ON `interview_answers` (`question_id`);
