import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../backend/models/User.js";
import Post from "../backend/models/Post.js";
import JobPost from "../backend/models/JobPost.js";
import Event from "../backend/models/Event.js";
import Discussion from "../backend/models/Discussion.js";
import Notification from "../backend/models/Notification.js";

dotenv.config();

// Sample data for posts
const postContents = [
    "Just finished my capstone project on AI-powered chatbot! 🎉 Learned so much about NLP and machine learning. Thanks to my team!",
    "Looking for advice on transitioning from web development to mobile development. Anyone here with experience in React Native?",
    "Attended the TechTalks PH conference today. Amazing insights on cloud computing and DevOps! #TechPH #CloudComputing",
    "Celebrating my 1st work anniversary at Accenture! Time flies when you're coding 💻 #TechCareer",
    "Does anyone have recommendations for online courses on cybersecurity? Planning to upskill this year.",
    "Proud to share that our team won the Hackathon Manila 2025! 🏆 Built a mobile app for local farmers. #HackathonPH",
    "Just deployed my first full-stack application using MERN stack! Check it out and let me know your feedback 🚀",
    "Grateful for the mentorship program here at TUP. My mentor helped me land my first tech job! 🙏",
    "Working on a machine learning project to predict traffic patterns in Metro Manila. Data science is fascinating!",
    "Anyone attending the Google I/O Extended Manila next month? Would love to connect!",
    "Completed AWS Solutions Architect certification today! Next goal: DevOps Engineer certification 📚",
    "Sharing my journey from student to software engineer. It's been challenging but rewarding. Keep coding! 💪",
    "Built a cool IoT project using Arduino and Raspberry Pi for my thesis. Smart home automation is the future!",
    "Just got promoted to Senior Developer! Hard work pays off. Thank you to everyone who supported me! 🎊",
    "Looking for collaborators on an open-source project. DM me if you're interested in contributing!",
    "Attended a workshop on UI/UX design today. Learned the importance of user-centered design thinking.",
    "Successfully migrated our entire infrastructure to cloud. AWS, Azure, or GCP? What's your preference?",
    "Grateful for the skills I learned at TUP. Now working remotely for a US-based startup! 🌏",
    "Just published my first tech article on Medium about React best practices. Check it out!",
    "Excited to announce I'm joining Globe Telecom as a Software Engineer next month! New chapter begins 📱"
];

// Sample job postings (Philippines-based, BSIT-related)
const jobPostings = [
    {
        title: "Junior Full Stack Developer",
        company: "Accenture Philippines",
        location: "Taguig City, Metro Manila",
        workType: "hybrid",
        type: "job",
        description: "We are looking for a motivated Junior Full Stack Developer to join our team. You will work on enterprise applications using modern web technologies.\n\nResponsibilities:\n• Develop and maintain web applications\n• Collaborate with cross-functional teams\n• Write clean, maintainable code\n• Participate in code reviews",
        requirements: "• Bachelor's degree in IT or related field\n• Knowledge of JavaScript, React, Node.js\n• 1+ years experience\n• Strong problem-solving skills\n• Good communication skills",
        skills: ["JavaScript", "React", "Node.js", "MongoDB"],
        salary: { min: 25000, max: 35000, currency: "PHP" }
    },
    {
        title: "Software Engineer - Mobile Development",
        company: "Globe Telecom",
        location: "Makati City, Metro Manila",
        workType: "onsite",
        type: "job",
        description: "Join our mobile development team to build innovative mobile applications for millions of Filipino users.\n\nResponsibilities:\n• Develop iOS and Android applications\n• Implement new features and functionality\n• Optimize app performance\n• Work with backend developers",
        requirements: "• Experience with React Native or Flutter\n• Knowledge of mobile app development lifecycle\n• Familiarity with REST APIs\n• 2+ years experience\n• Portfolio of published apps is a plus",
        skills: ["React Native", "Flutter", "Mobile Development", "REST API"],
        salary: { min: 40000, max: 60000, currency: "PHP" }
    },
    {
        title: "Cloud Solutions Architect",
        company: "IBM Philippines",
        location: "Quezon City, Metro Manila",
        workType: "hybrid",
        type: "job",
        description: "We're seeking an experienced Cloud Solutions Architect to design and implement cloud infrastructure solutions for our enterprise clients.\n\nResponsibilities:\n• Design cloud architecture solutions\n• Lead cloud migration projects\n• Provide technical guidance to teams\n• Conduct cloud assessments",
        requirements: "• AWS/Azure/GCP certification\n• 5+ years cloud experience\n• Strong understanding of cloud security\n• Excellent presentation skills\n• Enterprise solutions experience",
        skills: ["AWS", "Azure", "Cloud Architecture", "DevOps"],
        salary: { min: 80000, max: 120000, currency: "PHP" }
    },
    {
        title: "Data Analyst Intern",
        company: "Ayala Corporation",
        location: "Makati City, Metro Manila",
        workType: "onsite",
        type: "internship",
        description: "Great opportunity for students/fresh graduates to gain hands-on experience in data analytics and business intelligence.\n\nResponsibilities:\n• Assist in data collection and analysis\n• Create reports and dashboards\n• Support data-driven decision making\n• Learn from experienced data scientists",
        requirements: "• Currently pursuing or recently completed IT/CS degree\n• Basic knowledge of SQL and Excel\n• Interest in data analytics\n• Strong analytical thinking\n• Willing to learn",
        skills: ["SQL", "Excel", "Data Analysis", "Python"],
        salary: { min: 15000, max: 20000, currency: "PHP" },
        duration: "3-6 months"
    },
    {
        title: "DevOps Engineer",
        company: "Sprout Solutions",
        location: "Pasig City, Metro Manila",
        workType: "remote",
        type: "job",
        description: "Looking for a DevOps Engineer to help us build and maintain our cloud infrastructure and CI/CD pipelines.\n\nResponsibilities:\n• Manage cloud infrastructure (AWS)\n• Build and maintain CI/CD pipelines\n• Monitor system performance\n• Automate deployment processes",
        requirements: "• Experience with Docker and Kubernetes\n• Proficiency in scripting (Python, Bash)\n• Knowledge of AWS services\n• 3+ years experience\n• Understanding of DevOps best practices",
        skills: ["Docker", "Kubernetes", "AWS", "Python", "CI/CD"],
        salary: { min: 60000, max: 90000, currency: "PHP" }
    },
    {
        title: "Frontend Developer - React Specialist",
        company: "Sakura Autoworld Inc.",
        location: "Quezon City, Metro Manila",
        workType: "hybrid",
        type: "job",
        description: "We need a talented Frontend Developer with strong React skills to join our digital transformation team.\n\nResponsibilities:\n• Build responsive web applications\n• Implement modern UI/UX designs\n• Optimize application performance\n• Collaborate with designers and backend developers",
        requirements: "• 2+ years React experience\n• Strong CSS and JavaScript skills\n• Experience with state management (Redux/Context)\n• Portfolio of web projects required",
        skills: ["React", "JavaScript", "CSS", "Redux", "TypeScript"],
        salary: { min: 35000, max: 50000, currency: "PHP" }
    },
    {
        title: "Cybersecurity Specialist",
        company: "UnionBank of the Philippines",
        location: "Pasig City, Metro Manila",
        workType: "onsite",
        type: "job",
        description: "Join our cybersecurity team to protect our digital banking infrastructure and customer data.\n\nResponsibilities:\n• Monitor security threats and incidents\n• Conduct security assessments\n• Implement security controls\n• Respond to security incidents",
        requirements: "• Strong knowledge of cybersecurity principles\n• Experience with security tools (SIEM, IDS/IPS)\n• Understanding of network security\n• CEH or CISSP certification preferred",
        skills: ["Cybersecurity", "Network Security", "SIEM", "Penetration Testing"],
        salary: { min: 50000, max: 80000, currency: "PHP" }
    },
    {
        title: "Backend Developer - Node.js",
        company: "PayMongo",
        location: "Taguig City, Metro Manila",
        workType: "remote",
        type: "job",
        description: "We're looking for a Backend Developer to build scalable APIs and services for our payment platform.\n\nResponsibilities:\n• Develop RESTful APIs using Node.js\n• Design database schemas\n• Optimize API performance\n• Write unit and integration tests",
        requirements: "• 2+ years Node.js experience\n• Strong understanding of Express.js\n• Experience with MongoDB or PostgreSQL\n• Knowledge of API security best practices",
        skills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "API Development"],
        salary: { min: 45000, max: 70000, currency: "PHP" }
    },
    {
        title: "UI/UX Designer (IT Background)",
        company: "Thinking Machines Data Science",
        location: "Makati City, Metro Manila",
        workType: "hybrid",
        type: "job",
        description: "Looking for a UI/UX Designer with technical background to design data visualization dashboards and applications.\n\nResponsibilities:\n• Design user interfaces for web applications\n• Create wireframes and prototypes\n• Conduct user research\n• Collaborate with developers",
        requirements: "• IT/CS degree or equivalent\n• Proficiency in Figma or Adobe XD\n• Understanding of HTML/CSS\n• Portfolio showcasing UI/UX work",
        skills: ["UI/UX Design", "Figma", "Adobe XD", "HTML", "CSS"],
        salary: { min: 30000, max: 45000, currency: "PHP" }
    },
    {
        title: "IT Project Manager",
        company: "PLDT Inc.",
        location: "Makati City, Metro Manila",
        workType: "onsite",
        type: "job",
        description: "Seeking an experienced IT Project Manager to lead software development projects and teams.\n\nResponsibilities:\n• Manage IT projects from initiation to closure\n• Coordinate with stakeholders\n• Ensure project delivery on time and budget\n• Lead cross-functional teams",
        requirements: "• 5+ years IT project management experience\n• PMP or equivalent certification\n• Strong leadership skills\n• Experience with Agile methodologies",
        skills: ["Project Management", "Agile", "Scrum", "Leadership", "Stakeholder Management"],
        salary: { min: 70000, max: 100000, currency: "PHP" }
    }
];

// Sample events
const events = [
    {
        title: "TUP Tech Summit 2025",
        description: "Join us for a full-day technology summit featuring industry leaders, workshops, and networking opportunities. Learn about the latest trends in AI, cloud computing, and cybersecurity.\n\nAgenda:\n9:00 AM - Registration\n10:00 AM - Keynote Speech\n11:00 AM - Panel Discussion: Future of Tech in PH\n1:00 PM - Workshops (AI, Cloud, Security)\n4:00 PM - Networking Session",
        type: "Workshop",
        location: "TUP Manila Campus, Ayala Boulevard",
        isVirtual: false,
        capacity: 200,
        tags: ["technology", "AI", "cloud computing", "networking"]
    },
    {
        title: "Alumni Coding Bootcamp: Web Development",
        description: "Free coding bootcamp for TUP students and alumni. Learn modern web development using React and Node.js from industry professionals.\n\nTopics Covered:\n• React fundamentals\n• State management\n• RESTful APIs\n• Database integration\n• Deployment strategies",
        type: "Workshop",
        location: "Online via Zoom",
        isVirtual: true,
        virtualLink: "https://zoom.us/j/example",
        capacity: 50,
        tags: ["coding", "web development", "react", "nodejs"]
    },
    {
        title: "Career Fair 2025: Tech Companies Hiring",
        description: "Connect with top tech companies in the Philippines! Bring your resume and meet recruiters from Accenture, Globe, IBM, and more.\n\nParticipating Companies:\n• Accenture\n• Globe Telecom\n• IBM Philippines\n• Sprout Solutions\n• Many more!",
        type: "Reunion",
        location: "TUP Gymnasium",
        isVirtual: false,
        capacity: 500,
        tags: ["career", "job fair", "networking", "recruitment"]
    },
    {
        title: "Machine Learning Workshop for Beginners",
        description: "Introduction to Machine Learning using Python. Perfect for those who want to start their journey in AI and data science.\n\nWhat you'll learn:\n• Python basics for ML\n• Introduction to TensorFlow\n• Building your first ML model\n• Hands-on exercises",
        type: "Workshop",
        location: "Online via Google Meet",
        isVirtual: true,
        virtualLink: "https://meet.google.com/example",
        capacity: 100,
        tags: ["machine learning", "AI", "python", "data science"]
    },
    {
        title: "Alumni Homecoming 2025",
        description: "Reconnect with old friends and classmates! Join us for a day of reminiscing, networking, and celebrating TUP's legacy.\n\nActivities:\n• Campus tour\n• Alumni recognition\n• Networking lunch\n• Sports activities\n• Evening gala",
        type: "Reunion",
        location: "TUP Manila Campus",
        isVirtual: false,
        capacity: 300,
        tags: ["reunion", "alumni", "networking", "celebration"]
    },
    {
        title: "Cybersecurity Awareness Seminar",
        description: "Learn how to protect yourself and your organization from cyber threats. Expert speakers from leading cybersecurity firms.\n\nTopics:\n• Common cyber threats\n• Best security practices\n• Password management\n• Social engineering awareness\n• Incident response",
        type: "Webinar",
        location: "TUP Conference Hall / Online",
        isVirtual: false,
        capacity: 150,
        tags: ["cybersecurity", "security", "webinar", "awareness"]
    }
];

// Sample discussion topics
const discussions = [
    {
        title: "Best Practices for Remote Work as a Developer",
        content: "Hi everyone! I recently started working remotely and I'm finding it challenging to stay productive. What are your tips and tools for remote work? How do you manage work-life balance?",
        category: "Career"
    },
    {
        title: "Transitioning from Web to Mobile Development",
        content: "I've been a web developer for 3 years and I'm interested in mobile development. Should I learn React Native, Flutter, or native development? What resources do you recommend?",
        category: "Career"
    },
    {
        title: "Recommended Certifications for IT Professionals",
        content: "What certifications are worth pursuing in 2025? I'm considering AWS, Azure, or Google Cloud certifications. Which one has better job prospects in the Philippines?",
        category: "Career"
    },
    {
        title: "How to Prepare for Technical Interviews",
        content: "I have upcoming technical interviews with big tech companies. Any tips on how to prepare? What topics should I focus on? How do you handle coding challenges during interviews?",
        category: "Career"
    },
    {
        title: "Freelancing vs Full-time Employment",
        content: "I'm torn between accepting a full-time job offer or continuing as a freelancer. What are the pros and cons of each? What's your experience with freelancing in the Philippines?",
        category: "Career"
    },
    {
        title: "Best Resources for Learning Data Science",
        content: "I want to transition into data science. Can anyone recommend good online courses, books, or bootcamps? Is it better to learn Python or R first?",
        category: "Technical"
    },
    {
        title: "Dealing with Imposter Syndrome in Tech",
        content: "Does anyone else struggle with imposter syndrome? I often feel like I'm not good enough compared to my colleagues. How do you overcome these feelings?",
        category: "General"
    },
    {
        title: "Side Projects: How to Stay Motivated?",
        content: "I keep starting side projects but never finish them. How do you stay motivated to complete personal projects while working full-time? Any tips for time management?",
        category: "General"
    },
    {
        title: "Salary Expectations for Fresh Graduates (2025)",
        content: "What's a reasonable salary expectation for fresh IT graduates in Metro Manila? I'm getting offers ranging from ₱18k to ₱30k. What should I consider besides salary?",
        category: "Career"
    },
    {
        title: "Docker vs Virtual Machines: When to Use What?",
        content: "Can someone explain the practical differences between Docker and VMs? When should I use one over the other? I'm setting up a development environment and not sure which to choose.",
        category: "Technical"
    }
];

// Helper function to get random element from array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random elements from array
const getRandomElements = (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Helper function to get random date in the past
const getRandomPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date;
};

// Helper function to get random future date
const getRandomFutureDate = (daysAhead) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 7); // At least 7 days from now
    return date;
};

async function populateData() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Get all users (excluding super admins for realistic data)
        const users = await User.find({ permission: { $ne: 'superAdmin' } }).select('_id username tuptId role');
        
        if (users.length === 0) {
            console.log("❌ No users found. Please run createSuperAdmin.js first or import users.");
            process.exit(1);
        }

        console.log(`📊 Found ${users.length} users`);

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log("\n🗑️  Clearing existing data...");
        await Post.deleteMany({});
        await JobPost.deleteMany({});
        await Event.deleteMany({});
        await Discussion.deleteMany({});
        console.log("✅ Cleared existing posts, jobs, events, and discussions");

        // Create Posts
        console.log("\n📝 Creating posts...");
        const createdPosts = [];
        for (let i = 0; i < Math.min(postContents.length, users.length); i++) {
            const author = users[i % users.length];
            const post = new Post({
                author: author._id,
                content: postContents[i],
                image: "",
                likes: getRandomElements(users, Math.floor(Math.random() * 10)).map(u => u._id),
                comments: [],
                createdAt: getRandomPastDate(30)
            });
            await post.save();
            createdPosts.push(post);
        }
        console.log(`✅ Created ${createdPosts.length} posts`);

        // Create Job Postings
        console.log("\n💼 Creating job postings...");
        const createdJobs = [];
        // Get alumni/staff users, or fall back to any user if none exist
        const jobPosters = users.filter(u => u.role === 'alumni' || u.role === 'staff');
        const posterPool = jobPosters.length > 0 ? jobPosters : users;
        
        for (const jobData of jobPostings) {
            const author = getRandomElement(posterPool);
            const applicantUsers = getRandomElements(users, Math.floor(Math.random() * 5));
            const applicants = applicantUsers.map(u => ({
                user: u._id,
                appliedAt: getRandomPastDate(30),
                status: getRandomElement(['pending', 'reviewed', 'shortlisted'])
            }));
            
            const job = new JobPost({
                author: author._id,
                ...jobData,
                applicants: applicants,
                likes: getRandomElements(users, Math.floor(Math.random() * 8)).map(u => u._id),
                comments: [],
                createdAt: getRandomPastDate(60)
            });
            await job.save();
            createdJobs.push(job);
        }
        console.log(`✅ Created ${createdJobs.length} job postings`);

        // Create Events
        console.log("\n📅 Creating events...");
        const createdEvents = [];
        // Get alumni/staff users, or fall back to any user if none exist
        const eventOrganizers = users.filter(u => u.role === 'alumni' || u.role === 'staff');
        const organizerPool = eventOrganizers.length > 0 ? eventOrganizers : users;
        
        for (const eventData of events) {
            const organizer = getRandomElement(organizerPool);
            const futureDate = getRandomFutureDate(90);
            
            // Format date and time for the event
            const eventDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const hours = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
            const minutes = Math.random() < 0.5 ? '00' : '30';
            const eventTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            const eventDuration = 2 + Math.floor(Math.random() * 6); // 2-8 hours
            
            const attendeeUsers = getRandomElements(users, Math.floor(Math.random() * Math.min(eventData.capacity / 2, 20)));
            const attendees = attendeeUsers.map(u => ({
                user: u._id,
                rsvpStatus: getRandomElement(['going', 'interested']),
                rsvpDate: getRandomPastDate(14),
                reminderEnabled: Math.random() > 0.5
            }));
            
            const event = new Event({
                organizer: organizer._id,
                ...eventData,
                eventDate,
                eventTime,
                eventDuration,
                attendees: attendees,
                status: 'upcoming',
                createdAt: getRandomPastDate(30)
            });
            await event.save();
            createdEvents.push(event);
        }
        console.log(`✅ Created ${createdEvents.length} events`);

        // Create Discussions
        console.log("\n💬 Creating discussion forums...");
        const createdDiscussions = [];
        for (const discussionData of discussions) {
            const author = getRandomElement(users);
            const discussion = new Discussion({
                author: author._id,
                ...discussionData,
                comments: [],
                likes: getRandomElements(users, Math.floor(Math.random() * 15)).map(u => u._id),
                tags: [],
                createdAt: getRandomPastDate(45)
            });
            await discussion.save();
            createdDiscussions.push(discussion);

            // Add some comments to discussions
            const numComments = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < numComments; i++) {
                const commenter = getRandomElement(users);
                const commentContents = [
                    "Great question! I've been dealing with the same thing.",
                    "Here's what worked for me: consistency and practice.",
                    "I recommend checking out online courses on Udemy or Coursera.",
                    "From my experience, it's all about finding what works best for you.",
                    "Don't forget to network with other professionals in the field!",
                    "This is really helpful, thanks for sharing!",
                    "I agree with the points mentioned above.",
                    "Have you considered trying a different approach?",
                    "In my opinion, the best way is to start with the basics.",
                    "I struggled with this too, but eventually figured it out."
                ];
                
                discussion.comments.push({
                    user: commenter._id,
                    content: getRandomElement(commentContents),
                    likes: getRandomElements(users, Math.floor(Math.random() * 8)).map(u => u._id),
                    dislikes: [],
                    replies: [],
                    createdAt: new Date(discussion.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
                });
            }
            await discussion.save();
        }
        console.log(`✅ Created ${createdDiscussions.length} discussions with comments`);

        // Add some comments to posts
        console.log("\n💬 Adding comments to posts...");
        const commentTexts = [
            "Great work! Keep it up! 🎉",
            "Congratulations! Well deserved!",
            "This is amazing! Thanks for sharing.",
            "Very informative, learned a lot!",
            "Count me in! Sounds interesting.",
            "I totally relate to this!",
            "Thanks for the recommendation!",
            "This is exactly what I needed!",
            "Impressive! How long did it take?",
            "Would love to know more about this!"
        ];

        for (const post of createdPosts) {
            const numComments = Math.floor(Math.random() * 5);
            for (let i = 0; i < numComments; i++) {
                const commenter = getRandomElement(users);
                post.comments.push({
                    user: commenter._id,
                    content: getRandomElement(commentTexts),
                    likes: [],
                    dislikes: [],
                    replies: [],
                    createdAt: new Date(post.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
                });
            }
            await post.save();
        }
        console.log("✅ Added comments to posts");

        // Summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 POPULATION SUMMARY");
        console.log("=".repeat(50));
        console.log(`📝 Posts created: ${createdPosts.length}`);
        console.log(`💼 Job postings created: ${createdJobs.length}`);
        console.log(`📅 Events created: ${createdEvents.length}`);
        console.log(`💬 Discussions created: ${createdDiscussions.length}`);
        console.log(`👥 Users in database: ${users.length}`);
        console.log("=".repeat(50));
        console.log("\n✅ Database population completed successfully!");

    } catch (error) {
        console.error("❌ Error populating database:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("\n🔌 Disconnected from MongoDB");
        process.exit(0);
    }
}

// Run the script
populateData();
