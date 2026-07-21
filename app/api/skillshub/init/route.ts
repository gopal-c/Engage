import { NextResponse } from "next/server";
import { getProfileCount, getMilestoneCount, seedProfile, seedMilestone } from "@/lib/skillshub/storage";
import type { Seniority, Skill, Project, Education, MilestoneCreator, MilestoneCategory } from "@/lib/skillshub/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_PROFILES: Array<{
  name: string; email: string; city: string; seniority: Seniority; yearsExperience: number;
  skills: Skill[]; projects: Project[]; education: Education[];
  joiningDate?: string; dateOfBirth?: string;
}> = [
  {
    name: "Priya Sharma", email: "priya.sharma@valueaddsofttech.com", city: "Mumbai", seniority: "senior", yearsExperience: 7,
    skills: [
      { name: "React", category: "framework", proficiency: "expert", yearsExperience: 5 },
      { name: "TypeScript", category: "language", proficiency: "advanced", yearsExperience: 4 },
      { name: "Node.js", category: "framework", proficiency: "advanced", yearsExperience: 6 },
    ],
    projects: [{ name: "E-Commerce Platform", description: "Built a full-stack e-commerce platform with React and Node.js", skillsUsed: ["React", "Node.js", "PostgreSQL"], duration: "18 months" }],
    education: [{ degree: "B.Tech Computer Science", institution: "IIT Bombay", year: 2017 }],
    joiningDate: "2019-03-15", dateOfBirth: "1995-06-20",
  },
  {
    name: "Rahul Verma", email: "rahul.verma@valueaddsofttech.com", city: "Bangalore", seniority: "mid", yearsExperience: 4,
    skills: [
      { name: "Python", category: "language", proficiency: "advanced", yearsExperience: 4 },
      { name: "Django", category: "framework", proficiency: "intermediate", yearsExperience: 3 },
      { name: "AWS", category: "cloud", proficiency: "intermediate", yearsExperience: 2 },
    ],
    projects: [{ name: "Analytics Dashboard", description: "Designed real-time analytics dashboard for internal metrics", skillsUsed: ["Python", "Django", "Redis"], duration: "8 months" }],
    education: [{ degree: "M.Sc Data Science", institution: "IISC Bangalore", year: 2020 }],
    joiningDate: "2021-01-10", dateOfBirth: "1997-11-05",
  },
  {
    name: "Anita Desai", email: "anita.desai@valueaddsofttech.com", city: "Pune", seniority: "lead", yearsExperience: 10,
    skills: [
      { name: "Java", category: "language", proficiency: "expert", yearsExperience: 10 },
      { name: "Spring Boot", category: "framework", proficiency: "expert", yearsExperience: 7 },
      { name: "Kubernetes", category: "cloud", proficiency: "advanced", yearsExperience: 4 },
    ],
    projects: [{ name: "Microservices Migration", description: "Led migration of monolith to microservices architecture", skillsUsed: ["Java", "Spring Boot", "Kubernetes", "Docker"], duration: "24 months" }],
    education: [{ degree: "B.E. Information Technology", institution: "COEP Pune", year: 2014 }, { degree: "AWS Solutions Architect Certification", institution: "Amazon", year: 2022 }],
    joiningDate: "2016-07-01", dateOfBirth: "1992-03-12",
  },
];

const DEMO_MILESTONES: Array<{ profileIdx: number; title: string; milestoneDate: string; createdBy: MilestoneCreator; category: MilestoneCategory }> = [
  { profileIdx: 0, title: "Promoted to Senior Engineer", milestoneDate: "2022-04-01", createdBy: "hr", category: "promotion" },
  { profileIdx: 0, title: "React Advanced Certification", milestoneDate: "2021-09-15", createdBy: "employee", category: "certification" },
  { profileIdx: 2, title: "Promoted to Tech Lead", milestoneDate: "2023-01-15", createdBy: "hr", category: "promotion" },
  { profileIdx: 2, title: "CKA Kubernetes Certification", milestoneDate: "2022-06-20", createdBy: "employee", category: "certification" },
];

export async function GET() {
  try {
    const profileCount = await getProfileCount();
    if (profileCount > 0) {
      return NextResponse.json({ ok: true, message: "Already seeded.", profileCount });
    }

    const profileIds: string[] = [];
    for (const p of DEMO_PROFILES) {
      const id = await seedProfile(p);
      profileIds.push(id);
    }

    for (const m of DEMO_MILESTONES) {
      await seedMilestone({
        profileId: profileIds[m.profileIdx],
        title: m.title,
        milestoneDate: m.milestoneDate,
        createdBy: m.createdBy,
        category: m.category,
      });
    }

    const milestoneCount = await getMilestoneCount();
    return NextResponse.json({ ok: true, profilesInserted: profileIds.length, milestonesInserted: milestoneCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "init failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
