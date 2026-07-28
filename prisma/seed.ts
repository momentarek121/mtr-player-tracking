import { PrismaClient, SkillDomain, Sport } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const skills = [
    // BJJ technical
    { name: "Closed Guard", domain: SkillDomain.TECHNICAL, sport: Sport.BJJ },
    { name: "Half Guard", domain: SkillDomain.TECHNICAL, sport: Sport.BJJ },
    { name: "Mount & Back Control", domain: SkillDomain.TECHNICAL, sport: Sport.BJJ },
    { name: "Sweeps", domain: SkillDomain.TECHNICAL, sport: Sport.BJJ },
    { name: "Submissions", domain: SkillDomain.TECHNICAL, sport: Sport.BJJ },
    { name: "Takedowns", domain: SkillDomain.TECHNICAL, sport: Sport.BOTH },
    { name: "Escapes", domain: SkillDomain.TECHNICAL, sport: Sport.BJJ },
    // MMA technical
    { name: "Striking (Boxing)", domain: SkillDomain.TECHNICAL, sport: Sport.MMA },
    { name: "Kicking", domain: SkillDomain.TECHNICAL, sport: Sport.MMA },
    { name: "Clinch Work", domain: SkillDomain.TECHNICAL, sport: Sport.MMA },
    { name: "Ground & Pound", domain: SkillDomain.TECHNICAL, sport: Sport.MMA },
    { name: "Takedown Defense", domain: SkillDomain.TECHNICAL, sport: Sport.MMA },
    // Tactical
    { name: "Game Plan Execution", domain: SkillDomain.TACTICAL, sport: Sport.BOTH },
    { name: "Cage/Mat Awareness", domain: SkillDomain.TACTICAL, sport: Sport.BOTH },
    // Physical
    { name: "Conditioning", domain: SkillDomain.PHYSICAL, sport: Sport.BOTH },
    { name: "Strength", domain: SkillDomain.PHYSICAL, sport: Sport.BOTH },
    { name: "Flexibility", domain: SkillDomain.PHYSICAL, sport: Sport.BOTH },
    // Mental
    { name: "Composure Under Pressure", domain: SkillDomain.MENTAL, sport: Sport.BOTH },
    { name: "Coachability", domain: SkillDomain.MENTAL, sport: Sport.BOTH },
    { name: "Discipline & Consistency", domain: SkillDomain.MENTAL, sport: Sport.BOTH },
  ];

  const created: Record<string, string> = {};
  for (const s of skills) {
    const rec = await prisma.skillCategory.create({ data: s });
    created[s.name] = rec.id;
  }

  // Starter roadmap rules — coach can add more from the admin UI
  const rules = [
    {
      skill: "Takedown Defense",
      name: "Weak takedown defense",
      scoreBelow: 5,
      recommendation:
        "Add 2x/week wrestling defense drilling (sprawl, underhooks, hip escape) before live rounds.",
      priority: 1,
    },
    {
      skill: "Conditioning",
      name: "Cardio below competition standard",
      scoreBelow: 6,
      recommendation:
        "Add interval conditioning (rounds-based, matching competition round length) 3x/week.",
      priority: 1,
    },
    {
      skill: "Submissions",
      name: "Limited submission repertoire",
      scoreBelow: 5,
      recommendation:
        "Focus next 4 weeks on 2 core submission chains from top and bottom position.",
      priority: 2,
    },
    {
      skill: "Composure Under Pressure",
      name: "Panics under pressure in sparring/competition",
      scoreBelow: 5,
      recommendation:
        "Increase live sparring rounds against tougher partners with a debrief after each round.",
      priority: 1,
    },
  ];

  for (const r of rules) {
    const skillId = created[r.skill];
    if (!skillId) continue;
    await prisma.roadmapRule.create({
      data: {
        name: r.name,
        skillCategoryId: skillId,
        scoreBelow: r.scoreBelow,
        recommendation: r.recommendation,
        priority: r.priority,
      },
    });
  }

  console.log("Seed complete:", Object.keys(created).length, "skills,", rules.length, "rules");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
