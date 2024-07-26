CREATE TABLE `usercredentials` (
  `user_id` integer PRIMARY KEY,
  `email` varchar(255),
  `password` varchar(255)
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
  `event_match` varchar(100)
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
  `event_id` varchar(255),
  `user_id` int,
  `user_participation` varchar(255)
);

CREATE TABLE `states` (
  `state` char,
  `state_code` int
);

ALTER TABLE `usercredentials` ADD FOREIGN KEY (`user_id`) REFERENCES `userprofile` (`user_id`);

ALTER TABLE `userprofile` ADD FOREIGN KEY (`user_id`) REFERENCES `eventdetails` (`event_id`);

ALTER TABLE `userprofile` ADD FOREIGN KEY (`user_id`) REFERENCES `volunteerhistory` (`user_id`);

ALTER TABLE `eventdetails` ADD FOREIGN KEY (`event_id`) REFERENCES `volunteerhistory` (`event_id`);