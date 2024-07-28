CREATE TABLE `usercredentials` (
  `user_id` integer AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) UNIQUE NOT NULL,
  `password` varchar(255),
  `role` ENUM('volunteer', 'admin')
);

CREATE TABLE `userprofile` (
  `user_id` integer PRIMARY KEY,
  `username` varchar(255),
  `full_name` varchar(50),
  `address1` varchar(100),
  `address2` varchar(100),
  `city` varchar(100),
  `state` char,
  `zipcode` char,
  `skills` text,
  `preferences` text,
  `availability` text,
  `profile_picture` varchar(255),
  FOREIGN KEY (user_id) REFERENCES usercredentials(user_id)
);

CREATE TABLE `eventdetails` (
  `event_id` char PRIMARY KEY,
  `event_name` varchar(255),
  `description` varchar(255),
  `location` varchar(255),
  `required_skills` varchar(255),
  `urgency` char,
  `event_date` datetime
);

CREATE TABLE `volunteerhistory` (
  `volunteer_event_id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int,
  `event_id` int,
  `participation` varchar(255)
  FOREIGN KEY (user_id) REFERENCES usercredentials(user_id)
  FOREIGN KEY (event_id) REFERENCES eventdetails(event_id)
);

CREATE TABLE `notifications` (
    `notification_id` int,
    `user_id` int,
    `message` TEXT,
    `created_at` timestamp DEFAULT current_timestamp,
    FOREIGN KEY (user_id) REFERENCES usercredentials(user_id)
);

CREATE TABLE `states` (
  `state` char,
  `state_code` int
);