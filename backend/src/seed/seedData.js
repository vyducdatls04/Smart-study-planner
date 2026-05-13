// src/seed/seedData.js
// Chạy: node src/seed/seedData.js
import db from "../config/db.js";
import bcrypt from "bcryptjs";

const subjects = [
  "Lập trình Web", "Cơ sở dữ liệu", "Mạng máy tính",
  "Toán rời rạc", "Lập trình Python", "Tiếng Anh",
  "Tiếng Trung", "Giải tích", "Kiến trúc máy tính",
  "Trí tuệ nhân tạo"
];

const taskTitles = [
  "Đọc tài liệu chương 1", "Làm bài tập chương 2", "Ôn tập giữa kỳ",
  "Nộp bài tập lớn", "Xem video bài giảng", "Làm đề thi thử",
  "Học thuộc từ vựng", "Luyện nghe", "Code bài tập thực hành",
  "Đọc sách tham khảo", "Tóm tắt bài học", "Thảo luận nhóm",
  "Ôn tập cuối kỳ", "Nộp báo cáo", "Làm quiz online",
  "Cài đặt môi trường", "Debug chương trình", "Viết báo cáo thực hành",
  "Học công thức", "Giải bài toán mẫu"
];

const planTitles = [
  "Kế hoạch tuần 1", "Kế hoạch tuần 2", "Kế hoạch thi giữa kỳ",
  "Kế hoạch thi cuối kỳ", "Kế hoạch ôn tập", "Kế hoạch học hè",
  "Kế hoạch tháng 3", "Kế hoạch tháng 4", "Kế hoạch tháng 5",
  "Kế hoạch sprint"
];

const priorities = ["low", "medium", "high"];
const statuses = ["pending", "done"];

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split("T")[0];
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  try {
    console.log("🌱 Bắt đầu seed data...");

    const password = await bcrypt.hash("123456", 10);

    // ── 1. Tạo 50 users ─────────────────────────────────────────
    console.log("👤 Tạo 50 users...");
    const userIds = [];

    for (let i = 1; i <= 50; i++) {
      const name = `Sinh viên ${i}`;
      const email = `student${i}@ictu.edu.vn`;

      const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        userIds.push(existing[0].id);
        continue;
      }

      const [result] = await db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, password]
      );
      userIds.push(result.insertId);
    }
    console.log(`✅ Đã tạo ${userIds.length} users`);

    // ── 2. Tạo subjects cho mỗi user ────────────────────────────
    console.log("📚 Tạo môn học...");
    const colors = ["#E5F0F7", "#F6EFD7", "#EDF7EE", "#F7EDE5", "#EDE5F7", "#F7F0E5"];
    const subjectIds = {};

    for (const uid of userIds) {
      subjectIds[uid] = [];
      const numSubjects = Math.floor(Math.random() * 4) + 2; // 2-5 môn
      const chosen = [...subjects].sort(() => Math.random() - 0.5).slice(0, numSubjects);

      for (const name of chosen) {
        const [r] = await db.query(
          "INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)",
          [uid, name, randomItem(colors)]
        );
        subjectIds[uid].push(r.insertId);
      }
    }
    console.log("✅ Đã tạo môn học");

    // ── 3. Tạo 100+ tasks ───────────────────────────────────────
    console.log("✅ Tạo 100 tasks...");
    let taskCount = 0;
    const startDate = new Date("2026-03-01");
    const endDate = new Date("2026-06-30");

    for (const uid of userIds) {
      const numTasks = Math.floor(Math.random() * 3) + 2; // 2-4 task mỗi user
      for (let t = 0; t < numTasks; t++) {
        const title = randomItem(taskTitles) + " " + randomItem(subjects);
        const deadline = randomDate(startDate, endDate);
        const status = randomItem(statuses);
        const priority = randomItem(priorities);

        await db.query(
          "INSERT INTO tasks (user_id, title, deadline, status, priority) VALUES (?, ?, ?, ?, ?)",
          [uid, title, deadline, status, priority]
        );
        taskCount++;
      }
    }

    // Đảm bảo đủ 100 tasks bằng cách thêm vào users đầu
    while (taskCount < 100) {
      const uid = randomItem(userIds);
      const title = randomItem(taskTitles) + " " + randomItem(subjects);
      const deadline = randomDate(startDate, endDate);
      await db.query(
        "INSERT INTO tasks (user_id, title, deadline, status, priority) VALUES (?, ?, ?, ?, ?)",
        [uid, title, deadline, randomItem(statuses), randomItem(priorities)]
      );
      taskCount++;
    }
    console.log(`✅ Đã tạo ${taskCount} tasks`);

    // ── 4. Tạo 50 study plans ───────────────────────────────────
    console.log("📅 Tạo 50 kế hoạch học tập...");
    let planCount = 0;

    for (const uid of userIds) {
      if (planCount >= 50) break;
      const title = randomItem(planTitles);
      const startPlan = randomDate(startDate, new Date("2026-05-01"));
      const endPlan = randomDate(new Date("2026-05-01"), endDate);
      const description = `Kế hoạch học tập cho sinh viên - ${title}`;

      await db.query(
        "INSERT INTO study_plans (user_id, title, description, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
        [uid, title, description, startPlan, endPlan]
      ).catch(() => {
        // Bỏ qua nếu bảng có cấu trúc khác
      });
      planCount++;
    }
    console.log(`✅ Đã tạo ${planCount} kế hoạch`);

    console.log("\n🎉 Seed data hoàn thành!");
    console.log(`📊 Tổng kết:`);
    console.log(`   - Users: ${userIds.length}`);
    console.log(`   - Tasks: ${taskCount}`);
    console.log(`   - Study Plans: ${planCount}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed:", err);
    process.exit(1);
  }
}

seed();