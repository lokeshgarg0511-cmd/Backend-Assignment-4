/**
 * Comprehensive Automated Verification Suite for Web Dev III Lab 4
 *
 * Runs all 14 scenarios required by the assignment specification:
 *  1. Successful signup
 *  2. Duplicate email signup
 *  3. Successful login
 *  4. Incorrect password
 *  5. Access protected route without token
 *  6. Access protected route with valid token
 *  7. Create note
 *  8. Retrieve all notes
 *  9. Retrieve individual note
 * 10. Update note
 * 11. Delete note
 * 12. Attempt to access another user's note (Forbidden 403)
 * 13. Test admin-only route (User fails with 403, Admin succeeds with 200)
 * 14. Test real-time chat with two connected clients via Socket.IO
 */

const http = require('http');
const ioClient = require('socket.io-client');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: Make HTTP JSON request
function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function pass(scenarioNumber, name, detail) {
  console.log(
    `${colors.green}✔ [Scenario ${scenarioNumber}] ${name}${colors.reset}\n   ${colors.cyan}${detail}${colors.reset}\n`
  );
}

function fail(scenarioNumber, name, detail, error) {
  console.error(
    `${colors.red}✘ [Scenario ${scenarioNumber}] ${name} FAILED!${colors.reset}\n   ${detail}\n   Error: ${error}\n`
  );
  process.exitCode = 1;
}

async function runTests() {
  console.log(`\n===============================================================`);
  console.log(`   LAB 4 VERIFICATION TEST SUITE (14 Required Scenarios)`);
  console.log(`   Target Server: ${BASE_URL}`);
  console.log(`===============================================================\n`);

  const uniqueId = Date.now();
  const user1Email = `user1_${uniqueId}@example.com`;
  const user2Email = `user2_${uniqueId}@example.com`;
  const adminEmail = `admin_${uniqueId}@example.com`;
  const password = 'Password@123';

  let user1Token = '';
  let user2Token = '';
  let adminToken = '';
  let createdNoteId = '';
  let user2NoteId = '';

  try {
    // -------------------------------------------------------------
    // Scenario 1: Successful signup
    // -------------------------------------------------------------
    {
      const res = await apiRequest('POST', '/api/auth/signup', {
        username: 'alice',
        email: user1Email,
        password: password,
        role: 'user'
      });
      if (res.status === 201 && res.body.success && res.body.data.id) {
        pass(1, 'Successful signup', `Status 201 Created. User registered: ${res.body.data.email}`);
      } else {
        throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 2: Duplicate email signup
    // -------------------------------------------------------------
    {
      const res = await apiRequest('POST', '/api/auth/signup', {
        username: 'alice_duplicate',
        email: user1Email,
        password: password
      });
      if (res.status === 400 && !res.body.success) {
        pass(2, 'Duplicate email signup rejection', `Status 400 Bad Request. Message: "${res.body.message}"`);
      } else {
        throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 3: Successful login
    // -------------------------------------------------------------
    {
      const res = await apiRequest('POST', '/api/auth/login', {
        email: user1Email,
        password: password
      });
      if (res.status === 200 && res.body.success && res.body.token) {
        user1Token = res.body.token;
        pass(3, 'Successful login with JWT generation', `Status 200 OK. Token received (Length: ${user1Token.length})`);
      } else {
        throw new Error(`Expected 200 with token, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 4: Incorrect password
    // -------------------------------------------------------------
    {
      const res = await apiRequest('POST', '/api/auth/login', {
        email: user1Email,
        password: 'WrongPassword999!'
      });
      if (res.status === 401 && !res.body.success) {
        pass(4, 'Incorrect password handling', `Status 401 Unauthorized. Message: "${res.body.message}"`);
      } else {
        throw new Error(`Expected 401, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 5: Access protected route without token
    // -------------------------------------------------------------
    {
      const res = await apiRequest('GET', '/api/notes');
      if (res.status === 401 && !res.body.success) {
        pass(5, 'Access protected route without token', `Status 401 Unauthorized. Rejected with message: "${res.body.message}"`);
      } else {
        throw new Error(`Expected 401, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 6: Access protected route with valid token
    // -------------------------------------------------------------
    {
      const res = await apiRequest('GET', '/api/auth/profile', null, user1Token);
      if (res.status === 200 && res.body.success && res.body.user) {
        pass(6, 'Access protected route with valid token', `Status 200 OK. Profile fetched for user: ${res.body.user.username}`);
      } else {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 7: Create note
    // -------------------------------------------------------------
    {
      const res = await apiRequest(
        'POST',
        '/api/notes',
        {
          title: 'Lab 4 Architecture Plan',
          content: 'This note covers JWT, Express, MongoDB, Socket.IO and EventEmitter implementation.'
        },
        user1Token
      );
      if (res.status === 201 && res.body.success && res.body.data._id) {
        createdNoteId = res.body.data._id;
        pass(7, 'Create note (Protected)', `Status 201 Created. Note ID: ${createdNoteId}, Title: "${res.body.data.title}"`);
      } else {
        throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 8: Retrieve all notes
    // -------------------------------------------------------------
    {
      const res = await apiRequest('GET', '/api/notes', null, user1Token);
      if (res.status === 200 && res.body.success && Array.isArray(res.body.data)) {
        pass(8, 'Retrieve all notes for logged-in user', `Status 200 OK. Retrieved ${res.body.count} note(s).`);
      } else {
        throw new Error(`Expected 200 array, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 9: Retrieve individual note
    // -------------------------------------------------------------
    {
      const res = await apiRequest('GET', `/api/notes/${createdNoteId}`, null, user1Token);
      if (res.status === 200 && res.body.success && res.body.data._id === createdNoteId) {
        pass(9, 'Retrieve individual note by ID', `Status 200 OK. Found Note: "${res.body.data.title}"`);
      } else {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 10: Update note
    // -------------------------------------------------------------
    {
      const res = await apiRequest(
        'PUT',
        `/api/notes/${createdNoteId}`,
        {
          title: 'Lab 4 Architecture Plan (Updated)',
          content: 'Updated content with verified security tests.'
        },
        user1Token
      );
      if (res.status === 200 && res.body.success && res.body.data.title.includes('Updated')) {
        pass(10, 'Update note', `Status 200 OK. Updated title: "${res.body.data.title}"`);
      } else {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // Prepare User 2 for isolation testing
    {
      await apiRequest('POST', '/api/auth/signup', {
        username: 'bob',
        email: user2Email,
        password: password,
        role: 'user'
      });
      const login2 = await apiRequest('POST', '/api/auth/login', {
        email: user2Email,
        password: password
      });
      user2Token = login2.body.token;

      // User 2 creates their own note
      const u2Note = await apiRequest(
        'POST',
        '/api/notes',
        {
          title: "Bob's Secret Note",
          content: 'Confidential to Bob.'
        },
        user2Token
      );
      user2NoteId = u2Note.body.data._id;
    }

    // -------------------------------------------------------------
    // Scenario 12: Attempt to access another user's note
    // -------------------------------------------------------------
    {
      // User 1 tries to read Bob's note
      const res = await apiRequest('GET', `/api/notes/${user2NoteId}`, null, user1Token);
      if (res.status === 403 && !res.body.success) {
        pass(
          12,
          "Attempt to access another user's note (Security Check)",
          `Status 403 Forbidden. Successfully blocked unauthorized access! Message: "${res.body.message}"`
        );
      } else {
        throw new Error(`Expected 403 Forbidden, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 11: Delete note
    // -------------------------------------------------------------
    {
      const res = await apiRequest('DELETE', `/api/notes/${createdNoteId}`, null, user1Token);
      if (res.status === 200 && res.body.success) {
        pass(11, 'Delete note', `Status 200 OK. Deleted Note ID: ${res.body.data.id}`);
      } else {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 13: Test admin-only route (RBAC)
    // -------------------------------------------------------------
    {
      // 13a: Regular user attempts to access admin endpoint -> 403 Forbidden
      const resUser = await apiRequest('GET', '/api/auth/admin', null, user1Token);
      if (resUser.status !== 403) {
        throw new Error(`Expected 403 for user role on admin route, got ${resUser.status}`);
      }

      // 13b: Register Admin user and access admin endpoint -> 200 OK
      await apiRequest('POST', '/api/auth/signup', {
        username: 'superadmin',
        email: adminEmail,
        password: password,
        role: 'admin'
      });

      const adminLogin = await apiRequest('POST', '/api/auth/login', {
        email: adminEmail,
        password: password
      });
      adminToken = adminLogin.body.token;

      const resAdmin = await apiRequest('GET', '/api/auth/admin', null, adminToken);
      if (resAdmin.status === 200 && resAdmin.body.success) {
        pass(
          13,
          'Test admin-only route (RBAC)',
          `Non-admin blocked with 403 Forbidden.\n   Admin authorized with 200 OK: "${resAdmin.body.message}"`
        );
      } else {
        throw new Error(`Expected 200 for admin, got ${resAdmin.status}`);
      }
    }

    // -------------------------------------------------------------
    // Scenario 14: Test real-time chat with two connected clients
    // -------------------------------------------------------------
    {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket.IO test timed out after 8 seconds.'));
        }, 8000);

        const clientA = ioClient(BASE_URL, { reconnection: false });
        const clientB = ioClient(BASE_URL, { reconnection: false });
        const chatRoom = 'lab4-demo-room';
        let clientBReceived = false;

        clientA.on('connect', () => {
          clientA.emit('join_room', { username: 'AliceClient', room: chatRoom });
        });

        clientB.on('connect', () => {
          clientB.emit('join_room', { username: 'BobClient', room: chatRoom });

          // Once Client B is connected and joined, Client A sends a message
          setTimeout(() => {
            clientA.emit('send_message', {
              room: chatRoom,
              sender: 'AliceClient',
              message: 'Hello Bob! Real-time Socket.IO test message from Client A.'
            });
          }, 400);
        });

        clientB.on('receive_message', (msg) => {
          if (msg.sender === 'AliceClient' && msg.message.includes('Real-time Socket.IO test message')) {
            clientBReceived = true;
            clientA.disconnect();
            clientB.disconnect();
            clearTimeout(timeout);
            pass(
              14,
              'Real-time chat with two connected Socket.IO clients',
              `Client B successfully received real-time broadcast in room "${chatRoom}" from Client A:\n   "${msg.message}"`
            );
            resolve();
          }
        });

        clientA.on('connect_error', (err) => {
          clearTimeout(timeout);
          clientA.disconnect();
          clientB.disconnect();
          reject(err);
        });
      });
    }

    console.log(`\n===============================================================`);
    console.log(`${colors.green}${colors.bold}✔ ALL 14 LAB 4 SCENARIOS PASSED WITH ZERO ERRORS!${colors.reset}`);
    console.log(`===============================================================\n`);
    process.exit(0);
  } catch (err) {
    fail('ALL', 'Verification Test Suite', 'One or more tests failed', err.stack || err.message);
    process.exit(1);
  }
}

// Execute tests
runTests();

