import { db } from './db';
import bcrypt from 'bcrypt';
import {
  users,
  events,
  eventAdmins,
  eventRules,
  rounds,
  roundRules,
  questions,
  participants,
  testAttempts,
  answers,
  registrationForms,
  registrations,
  eventCredentials,
  auditLogs
} from '@shared/schema';

async function clearDatabase() {
  console.log('Clearing existing data...');

  // Delete from child tables first (respecting FK order if any)
  await db.delete(answers);
  await db.delete(testAttempts);
  await db.delete(eventCredentials);
  await db.delete(participants);
  await db.delete(questions);
  await db.delete(roundRules);
  await db.delete(rounds);
  await db.delete(eventRules);
  await db.delete(eventAdmins);
  await db.delete(registrations);
  await db.delete(registrationForms);
  await db.delete(events);
  await db.delete(auditLogs);
  await db.delete(users);

  console.log('✅ Database cleared successfully!');
}

async function seed() {
  console.log('🚀 Starting database seeding...');

  await clearDatabase();

  console.log('Creating users...');

  // 1. Super Admin (existing)
  const hashedSuperAdminPassword = await bcrypt.hash('Azzi@03', 10);
  const [superAdmin] = await db.insert(users).values({
    username: 'superadmin',
    password: hashedSuperAdminPassword,
    email: 'superadmin@example.com',
    fullName: 'Mohamed Azzim',
    role: 'super_admin',
    phone: '+916380083647'
  }).returning();

  // 2. Event Admin #1
  const hashedEventAdmin1Password = await bcrypt.hash('Admin@123', 10);
  const [eventAdmin1] = await db.insert(users).values({
    username: 'eventadmin1',
    password: hashedEventAdmin1Password,
    email: 'eventadmin1@example.com',
    fullName: 'Priya Sharma',
    role: 'event_admin',
    phone: '+919876543210'
  }).returning();

  // 3. Event Admin #2
  const hashedEventAdmin2Password = await bcrypt.hash('Admin@123', 10);
  const [eventAdmin2] = await db.insert(users).values({
    username: 'eventadmin2',
    password: hashedEventAdmin2Password,
    email: 'eventadmin2@example.com',
    fullName: 'Rahul Kumar',
    role: 'event_admin',
    phone: '+919876543211'
  }).returning();

  // 4. Registration Committee Member
  const hashedRegCommitteePassword = await bcrypt.hash('Committee@123', 10);
  const [regCommittee] = await db.insert(users).values({
    username: 'regcommittee',
    password: hashedRegCommitteePassword,
    email: 'regcommittee@example.com',
    fullName: 'Anjali Patel',
    role: 'registration_committee',
    phone: '+919876543212'
  }).returning();

  // 5. Participant Users
  const hashedParticipantPassword = await bcrypt.hash('Demo@123', 10);
  const [participant1] = await db.insert(users).values({
    username: 'participant1',
    password: hashedParticipantPassword,
    email: 'participant1@example.com',
    fullName: 'Arjun Reddy',
    role: 'participant',
    phone: '+919876543213'
  }).returning();

  const [participant2] = await db.insert(users).values({
    username: 'participant2',
    password: hashedParticipantPassword,
    email: 'participant2@example.com',
    fullName: 'Sneha Iyer',
    role: 'participant',
    phone: '+919876543214'
  }).returning();

  const [participant3] = await db.insert(users).values({
    username: 'participant3',
    password: hashedParticipantPassword,
    email: 'participant3@example.com',
    fullName: 'Vikram Singh',
    role: 'participant',
    phone: '+919876543215'
  }).returning();

  console.log('✅ Users created successfully!');

  console.log('Creating events...');

  // Sample Events
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() + 1);
  const endDate = new Date(currentDate);
  endDate.setDate(currentDate.getDate() + 7);

  const [webDevEvent] = await db.insert(events).values({
    name: 'Web Development Quiz',
    description: 'Test your knowledge of HTML, CSS, JavaScript, and modern web frameworks',
    type: 'quiz',
    category: 'technical',
    status: 'active',
    startDate: startDate,
    endDate: endDate,
    createdBy: superAdmin.id
  }).returning();

  const [gkEvent] = await db.insert(events).values({
    name: 'General Knowledge Challenge',
    description: 'A comprehensive test covering history, geography, science, and current affairs',
    type: 'quiz',
    category: 'non_technical',
    status: 'active',
    startDate: startDate,
    endDate: endDate,
    createdBy: superAdmin.id
  }).returning();

  console.log('✅ Events created successfully!');

  console.log('Assigning event admins...');

  // Event Admin Assignments
  await db.insert(eventAdmins).values([
    { eventId: webDevEvent.id, adminId: eventAdmin1.id },
    { eventId: gkEvent.id, adminId: eventAdmin2.id }
  ]);

  console.log('✅ Event admins assigned!');

  console.log('Creating event rules...');

  // Event Rules
  await db.insert(eventRules).values([
    {
      eventId: webDevEvent.id,
      noRefresh: true,
      noTabSwitch: true,
      forceFullscreen: true,
      disableShortcuts: true,
      autoSubmitOnViolation: true,
      maxTabSwitchWarnings: 2,
      additionalRules: null
    },
    {
      eventId: gkEvent.id,
      noRefresh: true,
      noTabSwitch: true,
      forceFullscreen: true,
      disableShortcuts: true,
      autoSubmitOnViolation: true,
      maxTabSwitchWarnings: 2,
      additionalRules: null
    }
  ]);

  console.log('✅ Event rules created!');

  console.log('Creating rounds...');

  // Rounds for Web Development Quiz
  const [webDevRound1] = await db.insert(rounds).values({
    eventId: webDevEvent.id,
    name: 'Frontend Fundamentals',
    description: 'HTML, CSS, and JavaScript basics',
    roundNumber: 1,
    duration: 30,
    status: 'not_started',
    startTime: null,
    endTime: null
  }).returning();

  const [webDevRound2] = await db.insert(rounds).values({
    eventId: webDevEvent.id,
    name: 'Framework Mastery',
    description: 'React, Vue, and Angular concepts',
    roundNumber: 2,
    duration: 45,
    status: 'not_started',
    startTime: null,
    endTime: null
  }).returning();

  // Rounds for General Knowledge Challenge
  const [gkRound1] = await db.insert(rounds).values({
    eventId: gkEvent.id,
    name: 'World Trivia',
    description: 'Geography, history, and cultures',
    roundNumber: 1,
    duration: 20,
    status: 'not_started',
    startTime: null,
    endTime: null
  }).returning();

  const [gkRound2] = await db.insert(rounds).values({
    eventId: gkEvent.id,
    name: 'Science & Technology',
    description: 'Scientific discoveries and tech innovations',
    roundNumber: 2,
    duration: 25,
    status: 'not_started',
    startTime: null,
    endTime: null
  }).returning();

  console.log('✅ Rounds created successfully!');

  console.log('Creating round rules...');

  // Round Rules (inheriting from event rules)
  await db.insert(roundRules).values([
    {
      roundId: webDevRound1.id,
      noRefresh: true,
      noTabSwitch: true,
      forceFullscreen: true,
      disableShortcuts: true,
      autoSubmitOnViolation: true,
      maxTabSwitchWarnings: 2,
      additionalRules: null
    },
    {
      roundId: webDevRound2.id,
      noRefresh: true,
      noTabSwitch: true,
      forceFullscreen: true,
      disableShortcuts: true,
      autoSubmitOnViolation: true,
      maxTabSwitchWarnings: 2,
      additionalRules: null
    },
    {
      roundId: gkRound1.id,
      noRefresh: true,
      noTabSwitch: true,
      forceFullscreen: true,
      disableShortcuts: true,
      autoSubmitOnViolation: true,
      maxTabSwitchWarnings: 2,
      additionalRules: null
    },
    {
      roundId: gkRound2.id,
      noRefresh: true,
      noTabSwitch: true,
      forceFullscreen: true,
      disableShortcuts: true,
      autoSubmitOnViolation: true,
      maxTabSwitchWarnings: 2,
      additionalRules: null
    }
  ]);

  console.log('✅ Round rules created!');

  console.log('Creating questions...');

  // Questions for Web Development Quiz - Round 1
  await db.insert(questions).values([
    // Multiple Choice Questions
    {
      roundId: webDevRound1.id,
      questionType: 'multiple_choice',
      questionText: 'What does HTML stand for?',
      questionNumber: 1,
      points: 1,
      options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
      correctAnswer: 'Hyper Text Markup Language',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'multiple_choice',
      questionText: 'Which CSS property controls text size?',
      questionNumber: 2,
      points: 1,
      options: ['font-size', 'text-size', 'font-style', 'text-style'],
      correctAnswer: 'font-size',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'multiple_choice',
      questionText: 'Which JavaScript method adds an element to the end of an array?',
      questionNumber: 3,
      points: 1,
      options: ['push()', 'pop()', 'shift()', 'unshift()'],
      correctAnswer: 'push()',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'multiple_choice',
      questionText: 'What is the correct way to declare a variable in JavaScript (ES6)?',
      questionNumber: 4,
      points: 1,
      options: ['let x = 5;', 'variable x = 5;', 'var x := 5;', 'int x = 5;'],
      correctAnswer: 'let x = 5;',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'multiple_choice',
      questionText: 'Which HTML tag is used for creating hyperlinks?',
      questionNumber: 5,
      points: 1,
      options: ['<a>', '<link>', '<href>', '<hyperlink>'],
      correctAnswer: '<a>',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'multiple_choice',
      questionText: 'What does CSS stand for?',
      questionNumber: 6,
      points: 1,
      options: ['Cascading Style Sheets', 'Creative Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'],
      correctAnswer: 'Cascading Style Sheets',
      expectedOutput: null,
      testCases: null
    },
    // True/False Questions
    {
      roundId: webDevRound1.id,
      questionType: 'true_false',
      questionText: 'JavaScript and Java are the same programming language.',
      questionNumber: 7,
      points: 1,
      options: ['True', 'False'],
      correctAnswer: 'False',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'true_false',
      questionText: 'CSS can be used to create animations.',
      questionNumber: 8,
      points: 1,
      options: ['True', 'False'],
      correctAnswer: 'True',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'true_false',
      questionText: 'HTML5 is the latest version of HTML.',
      questionNumber: 9,
      points: 1,
      options: ['True', 'False'],
      correctAnswer: 'True',
      expectedOutput: null,
      testCases: null
    },
    // Coding Question
    {
      roundId: webDevRound1.id,
      questionType: 'coding',
      questionText: 'Write a JavaScript function that takes two numbers and returns their sum.',
      questionNumber: 10,
      points: 3,
      options: null,
      correctAnswer: null,
      expectedOutput: 'function add(a, b) { return a + b; }',
      testCases: [{ input: 'add(2, 3)', expected: '5' }, { input: 'add(10, 20)', expected: '30' }]
    },
    // Descriptive Questions
    {
      roundId: webDevRound1.id,
      questionType: 'descriptive',
      questionText: 'Explain the difference between inline, block, and inline-block display properties in CSS.',
      questionNumber: 11,
      points: 2,
      options: null,
      correctAnswer: null,
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound1.id,
      questionType: 'descriptive',
      questionText: 'What is the purpose of the async and await keywords in JavaScript?',
      questionNumber: 12,
      points: 2,
      options: null,
      correctAnswer: null,
      expectedOutput: null,
      testCases: null
    }
  ]);

  // Questions for Web Development Quiz - Round 2
  await db.insert(questions).values([
    {
      roundId: webDevRound2.id,
      questionType: 'multiple_choice',
      questionText: 'What is React primarily used for?',
      questionNumber: 1,
      points: 1,
      options: ['Building user interfaces', 'Server-side logic', 'Database management', 'Network security'],
      correctAnswer: 'Building user interfaces',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound2.id,
      questionType: 'multiple_choice',
      questionText: 'Which hook is used for managing state in React functional components?',
      questionNumber: 2,
      points: 1,
      options: ['useState', 'useEffect', 'useContext', 'useReducer'],
      correctAnswer: 'useState',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound2.id,
      questionType: 'multiple_choice',
      questionText: 'What is Vue.js?',
      questionNumber: 3,
      points: 1,
      options: ['A JavaScript framework', 'A CSS preprocessor', 'A database', 'A testing library'],
      correctAnswer: 'A JavaScript framework',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound2.id,
      questionType: 'true_false',
      questionText: 'Angular is developed and maintained by Google.',
      questionNumber: 4,
      points: 1,
      options: ['True', 'False'],
      correctAnswer: 'True',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: webDevRound2.id,
      questionType: 'descriptive',
      questionText: 'Explain the concept of Virtual DOM in React.',
      questionNumber: 5,
      points: 2,
      options: null,
      correctAnswer: null,
      expectedOutput: null,
      testCases: null
    }
  ]);

  // Questions for General Knowledge Challenge - Round 1
  await db.insert(questions).values([
    {
      roundId: gkRound1.id,
      questionType: 'multiple_choice',
      questionText: 'What is the capital of France?',
      questionNumber: 1,
      points: 1,
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: gkRound1.id,
      questionType: 'multiple_choice',
      questionText: 'Which is the largest ocean on Earth?',
      questionNumber: 2,
      points: 1,
      options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
      correctAnswer: 'Pacific Ocean',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: gkRound1.id,
      questionType: 'multiple_choice',
      questionText: 'In which year did World War II end?',
      questionNumber: 3,
      points: 1,
      options: ['1943', '1944', '1945', '1946'],
      correctAnswer: '1945',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: gkRound1.id,
      questionType: 'true_false',
      questionText: 'The Great Wall of China is visible from space.',
      questionNumber: 4,
      points: 1,
      options: ['True', 'False'],
      correctAnswer: 'False',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: gkRound1.id,
      questionType: 'true_false',
      questionText: 'Mount Everest is the tallest mountain in the world.',
      questionNumber: 5,
      points: 1,
      options: ['True', 'False'],
      correctAnswer: 'True',
      expectedOutput: null,
      testCases: null
    }
  ]);

  // Questions for General Knowledge Challenge - Round 2
  await db.insert(questions).values([
    {
      roundId: gkRound2.id,
      questionType: 'multiple_choice',
      questionText: 'Who developed the theory of relativity?',
      questionNumber: 1,
      points: 1,
      options: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Nikola Tesla'],
      correctAnswer: 'Albert Einstein',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: gkRound2.id,
      questionType: 'multiple_choice',
      questionText: 'What is the chemical symbol for gold?',
      questionNumber: 2,
      points: 1,
      options: ['Go', 'Gd', 'Au', 'Ag'],
      correctAnswer: 'Au',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: gkRound2.id,
      questionType: 'true_false',
      questionText: 'The speed of light is faster than the speed of sound.',
      questionNumber: 3,
      points: 1,
      options: ['True', 'False'],
      correctAnswer: 'True',
      expectedOutput: null,
      testCases: null
    },
    {
      roundId: gkRound2.id,
      questionType: 'descriptive',
      questionText: 'Explain the process of photosynthesis.',
      questionNumber: 4,
      points: 2,
      options: null,
      correctAnswer: null,
      expectedOutput: null,
      testCases: null
    }
  ]);

  console.log('✅ Questions created successfully!');

  console.log('Registering participants...');

  // Register participants for events
  await db.insert(participants).values([
    { userId: participant1.id, eventId: webDevEvent.id, status: 'registered' },
    { userId: participant2.id, eventId: webDevEvent.id, status: 'registered' },
    { userId: participant3.id, eventId: gkEvent.id, status: 'registered' }
  ]);

  console.log('✅ Participants registered!');

  console.log('Creating event credentials...');

  // Create event credentials for participants
  await db.insert(eventCredentials).values([
    {
      participantUserId: participant1.id,
      eventId: webDevEvent.id,
      eventUsername: 'WEBDEV001',
      eventPassword: 'WebDev@2024',
      testEnabled: true,
      enabledAt: new Date(),
      enabledBy: superAdmin.id
    },
    {
      participantUserId: participant2.id,
      eventId: webDevEvent.id,
      eventUsername: 'WEBDEV002',
      eventPassword: 'WebDev@2024',
      testEnabled: true,
      enabledAt: new Date(),
      enabledBy: superAdmin.id
    },
    {
      participantUserId: participant3.id,
      eventId: gkEvent.id,
      eventUsername: 'GKCHALL001',
      eventPassword: 'GK@2024',
      testEnabled: false,
      enabledAt: null,
      enabledBy: null
    }
  ]);

  console.log('✅ Event credentials created!');

  console.log('Creating registration form...');

  // Create sample registration form
  await db.insert(registrationForms).values({
    title: 'BootFeet 2K26 Registration',
    description: 'Register for BootFeet 2K26 Symposium events',
    slug: 'bootfeet-2k26-registration',
    formFields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your.email@example.com' },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+91XXXXXXXXXX' },
      { id: 'college', label: 'College/Institution', type: 'text', required: true, placeholder: 'Your institution name' },
      { id: 'year', label: 'Year of Study', type: 'number', required: false, placeholder: '1, 2, 3, or 4' }
    ],
    allowedCategories: ['technical', 'non_technical'],
    isActive: true,
    createdBy: superAdmin.id
  });

  console.log('✅ Registration form created!');

  console.log('\n✅ Demo data created successfully!\n');
  console.log('📝 Demo Credentials:');
  console.log('Super Admin: superadmin / Azzi@03');
  console.log('Event Admin 1: eventadmin1 / Admin@123');
  console.log('Event Admin 2: eventadmin2 / Admin@123');
  console.log('Reg Committee: regcommittee / Committee@123');
  console.log('Participants: participant1-3 / Demo@123');
  console.log('\n🎯 Event Credentials:');
  console.log('WEBDEV001 / WebDev@2024 (test enabled)');
  console.log('WEBDEV002 / WebDev@2024 (test enabled)');
  console.log('GKCHALL001 / GK@2024 (test disabled)');
  console.log('\n🔗 Registration Form URL: /register/bootfeet-2k26-registration\n');
}

seed()
  .then(() => {
    console.log('🌱 Seeding finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  });
