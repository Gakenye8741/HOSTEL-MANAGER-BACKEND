CREATE TYPE "public"."academicYear" AS ENUM('Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Alumni');--> statement-breakpoint
CREATE TYPE "public"."grievanceCategory" AS ENUM('Academic', 'Finances', 'Security', 'Health', 'Facilities', 'Other');--> statement-breakpoint
CREATE TYPE "public"."itemStatus" AS ENUM('lost', 'found', 'processing', 'claimed');--> statement-breakpoint
CREATE TYPE "public"."notificationType" AS ENUM('announcement', 'poll_active', 'grievance_update', 'social_interaction');--> statement-breakpoint
CREATE TYPE "public"."pollStatus" AS ENUM('draft', 'active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."priorityLevel" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."reactionType" AS ENUM('like', 'dislike', 'fire', 'celebrate');--> statement-breakpoint
CREATE TYPE "public"."userRole" AS ENUM('student', 'leader', 'admin', 'staff', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."processStatus" AS ENUM('pending', 'received', 'under_review', 'resolved', 'rejected');--> statement-breakpoint
CREATE TABLE "announcementImages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcementId" uuid NOT NULL,
	"imageUrl" text NOT NULL,
	"displayOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcementTargetDepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcementId" uuid NOT NULL,
	"deptId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcementTargetFaculties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcementId" uuid NOT NULL,
	"facultyId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcementTargetYears" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcementId" uuid NOT NULL,
	"targetYear" "academicYear" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorId" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(50),
	"priority" "priorityLevel" DEFAULT 'medium',
	"isUrgent" boolean DEFAULT false,
	"isGlobal" boolean DEFAULT false,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"announcementId" uuid NOT NULL,
	"content" text NOT NULL,
	"isEdited" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facultyId" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"deptCode" varchar(20),
	"hodName" varchar(150),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_deptCode_unique" UNIQUE("deptCode")
);
--> statement-breakpoint
CREATE TABLE "documentVault" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"fileUrl" text NOT NULL,
	"category" varchar(100),
	"facultyId" uuid,
	"deptId" uuid,
	"uploadedBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"schoolCode" varchar(20),
	"deanName" varchar(150),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "faculties_name_unique" UNIQUE("name"),
	CONSTRAINT "faculties_schoolCode_unique" UNIQUE("schoolCode")
);
--> statement-breakpoint
CREATE TABLE "grievances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studentId" uuid,
	"category" "grievanceCategory" DEFAULT 'Other',
	"subject" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"priority" "priorityLevel" DEFAULT 'medium',
	"isAnonymous" boolean DEFAULT true,
	"status" "processStatus" DEFAULT 'pending',
	"adminResponse" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lostAndFound" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posterId" uuid,
	"itemName" varchar(100) NOT NULL,
	"description" text,
	"imageUrl" text,
	"locationFound" text,
	"status" "itemStatus" DEFAULT 'found',
	"claimedBy" uuid,
	"dateReported" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" "notificationType",
	"title" varchar(150) NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false,
	"link" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pollOptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pollId" uuid NOT NULL,
	"optionText" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pollVotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pollId" uuid NOT NULL,
	"optionId" uuid NOT NULL,
	"voterId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pollVotes_pollId_voterId_unique" UNIQUE("pollId","voterId")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creatorId" uuid,
	"question" text NOT NULL,
	"status" "pollStatus" DEFAULT 'active',
	"isGlobal" boolean DEFAULT true,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"announcementId" uuid NOT NULL,
	"type" "reactionType" DEFAULT 'like' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_userId_announcementId_type_unique" UNIQUE("userId","announcementId","type")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regNumber" varchar(50) NOT NULL,
	"fullName" text NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" text NOT NULL,
	"phoneNumber" varchar(15),
	"role" "userRole" DEFAULT 'student' NOT NULL,
	"otp" varchar(6),
	"otpExpiresAt" timestamp,
	"facultyId" uuid,
	"departmentId" uuid,
	"currentYear" "academicYear" DEFAULT 'Year 1',
	"entryYear" integer NOT NULL,
	"graduationYear" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"profileImage" text,
	"lastLogin" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "users_regNumber_unique" UNIQUE("regNumber"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "announcementImages" ADD CONSTRAINT "announcementImages_announcementId_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcementTargetDepts" ADD CONSTRAINT "announcementTargetDepts_announcementId_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcementTargetDepts" ADD CONSTRAINT "announcementTargetDepts_deptId_departments_id_fk" FOREIGN KEY ("deptId") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcementTargetFaculties" ADD CONSTRAINT "announcementTargetFaculties_announcementId_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcementTargetFaculties" ADD CONSTRAINT "announcementTargetFaculties_facultyId_faculties_id_fk" FOREIGN KEY ("facultyId") REFERENCES "public"."faculties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcementTargetYears" ADD CONSTRAINT "announcementTargetYears_announcementId_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_announcementId_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_faculties_id_fk" FOREIGN KEY ("facultyId") REFERENCES "public"."faculties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentVault" ADD CONSTRAINT "documentVault_facultyId_faculties_id_fk" FOREIGN KEY ("facultyId") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentVault" ADD CONSTRAINT "documentVault_deptId_departments_id_fk" FOREIGN KEY ("deptId") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentVault" ADD CONSTRAINT "documentVault_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_studentId_users_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lostAndFound" ADD CONSTRAINT "lostAndFound_posterId_users_id_fk" FOREIGN KEY ("posterId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lostAndFound" ADD CONSTRAINT "lostAndFound_claimedBy_users_id_fk" FOREIGN KEY ("claimedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollOptions" ADD CONSTRAINT "pollOptions_pollId_polls_id_fk" FOREIGN KEY ("pollId") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollVotes" ADD CONSTRAINT "pollVotes_pollId_polls_id_fk" FOREIGN KEY ("pollId") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollVotes" ADD CONSTRAINT "pollVotes_optionId_pollOptions_id_fk" FOREIGN KEY ("optionId") REFERENCES "public"."pollOptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollVotes" ADD CONSTRAINT "pollVotes_voterId_users_id_fk" FOREIGN KEY ("voterId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_creatorId_users_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_announcementId_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_facultyId_faculties_id_fk" FOREIGN KEY ("facultyId") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;