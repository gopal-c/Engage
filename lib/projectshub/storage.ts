import { sql, sqlRaw } from "../db";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  department: string | null;
  requiredSkills: string[];
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  members?: ProjectMember[];
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  assignedBy: string | null;
  assignedAt: string;
  userName?: string;
  userAvatar?: string | null;
  userEmail?: string;
  userDepartment?: string | null;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  completedAt: string | null;
  status: string;
  createdAt: string;
};

export type Channel = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  messageCount?: number;
};

export type Message = {
  id: string;
  channelId: string;
  userId: string;
  body: string;
  parentId: string | null;
  pinned: boolean;
  createdAt: string;
  userName?: string;
  userAvatar?: string | null;
  parentMessage?: { body: string; userName: string } | null;
};

function mapProject(r: Record<string, unknown>): Project {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string | null,
    status: r.status as string,
    department: r.department as string | null,
    requiredSkills: (r.required_skills as string[]) ?? [],
    startDate: r.start_date ? String(r.start_date) : null,
    endDate: r.end_date ? String(r.end_date) : null,
    createdBy: r.created_by as string,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    memberCount: r.member_count != null ? Number(r.member_count) : undefined,
  };
}

function mapMember(r: Record<string, unknown>): ProjectMember {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    userId: r.user_id as string,
    role: r.role as string,
    assignedBy: r.assigned_by as string | null,
    assignedAt: String(r.assigned_at),
    userName: r.user_name as string | undefined,
    userAvatar: r.user_avatar as string | null | undefined,
    userEmail: r.user_email as string | undefined,
    userDepartment: r.user_department as string | null | undefined,
  };
}

function mapMilestone(r: Record<string, unknown>): ProjectMilestone {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    title: r.title as string,
    description: r.description as string | null,
    targetDate: r.target_date ? String(r.target_date) : null,
    completedAt: r.completed_at ? String(r.completed_at) : null,
    status: r.status as string,
    createdAt: String(r.created_at),
  };
}

function mapChannel(r: Record<string, unknown>): Channel {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    name: r.name as string,
    createdAt: String(r.created_at),
    messageCount: r.message_count != null ? Number(r.message_count) : undefined,
  };
}

function mapMessage(r: Record<string, unknown>): Message {
  return {
    id: r.id as string,
    channelId: r.channel_id as string,
    userId: r.user_id as string,
    body: r.body as string,
    parentId: r.parent_id as string | null,
    pinned: r.pinned as boolean,
    createdAt: String(r.created_at),
    userName: r.user_name as string | undefined,
    userAvatar: r.user_avatar as string | null | undefined,
    parentMessage: r.parent_body ? { body: r.parent_body as string, userName: r.parent_user_name as string } : null,
  };
}

// --- Projects ---

export async function getProjects(opts: { status?: string; department?: string; search?: string } = {}) {
  let query = `
    SELECT p.*,
      (SELECT COUNT(*)::int FROM projectshub.project_members pm WHERE pm.project_id = p.id) AS member_count
    FROM projectshub.projects p
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let idx = 0;

  if (opts.status) {
    idx++;
    query += ` AND p.status = $${idx}`;
    params.push(opts.status);
  }
  if (opts.department) {
    idx++;
    query += ` AND p.department = $${idx}`;
    params.push(opts.department);
  }
  if (opts.search) {
    idx++;
    query += ` AND p.name ILIKE $${idx}`;
    params.push(`%${opts.search}%`);
  }

  query += ` ORDER BY p.created_at DESC`;

  const rows = await sqlRaw(query, params);
  return (rows as Record<string, unknown>[]).map(mapProject);
}

export async function getProject(id: string) {
  const rows = await sql`
    SELECT p.*,
      (SELECT COUNT(*)::int FROM projectshub.project_members pm WHERE pm.project_id = p.id) AS member_count
    FROM projectshub.projects p WHERE p.id = ${id}
  `;
  if (rows.length === 0) return null;
  return mapProject(rows[0] as Record<string, unknown>);
}

export async function createProject(data: {
  name: string; description?: string; status?: string; department?: string;
  requiredSkills?: string[]; startDate?: string; endDate?: string; createdBy: string;
}) {
  const rows = await sql`
    INSERT INTO projectshub.projects (name, description, status, department, required_skills, start_date, end_date, created_by)
    VALUES (
      ${data.name}, ${data.description ?? null}, ${data.status ?? "planning"},
      ${data.department ?? null}, ${data.requiredSkills ?? []},
      ${data.startDate ?? null}, ${data.endDate ?? null}, ${data.createdBy}
    )
    RETURNING id
  `;
  const projectId = rows[0].id as string;

  await sql`
    INSERT INTO projectshub.channels (project_id, name) VALUES (${projectId}, 'General')
  `;

  return projectId;
}

export async function updateProject(id: string, data: {
  name?: string; description?: string; status?: string; department?: string;
  requiredSkills?: string[]; startDate?: string; endDate?: string;
}) {
  const rows = await sql`
    UPDATE projectshub.projects SET
      name = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description),
      status = COALESCE(${data.status ?? null}, status),
      department = COALESCE(${data.department ?? null}, department),
      required_skills = COALESCE(${data.requiredSkills ?? null}, required_skills),
      start_date = COALESCE(${data.startDate ?? null}, start_date),
      end_date = COALESCE(${data.endDate ?? null}, end_date),
      updated_at = now()
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function deleteProject(id: string) {
  await sql`DELETE FROM projectshub.projects WHERE id = ${id}`;
}

// --- Members ---

export async function getProjectMembers(projectId: string) {
  const rows = await sql`
    SELECT pm.*, u.name AS user_name, u.avatar_url AS user_avatar, u.email AS user_email,
      (SELECT p.department FROM projectshub.projects p WHERE p.id = pm.project_id) AS user_department
    FROM projectshub.project_members pm
    JOIN auth.users u ON u.id = pm.user_id
    WHERE pm.project_id = ${projectId}
    ORDER BY pm.role = 'lead' DESC, pm.assigned_at ASC
  `;
  return (rows as Record<string, unknown>[]).map(mapMember);
}

export async function addProjectMember(projectId: string, userId: string, role: string, assignedBy: string) {
  const rows = await sql`
    INSERT INTO projectshub.project_members (project_id, user_id, role, assigned_by)
    VALUES (${projectId}, ${userId}, ${role}, ${assignedBy})
    ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role, assigned_by = EXCLUDED.assigned_by
    RETURNING id
  `;
  return rows[0]?.id as string;
}

export async function removeProjectMember(projectId: string, userId: string) {
  await sql`DELETE FROM projectshub.project_members WHERE project_id = ${projectId} AND user_id = ${userId}`;
}

export async function isProjectMember(projectId: string, userId: string) {
  const rows = await sql`
    SELECT 1 FROM projectshub.project_members WHERE project_id = ${projectId} AND user_id = ${userId}
  `;
  return rows.length > 0;
}

export async function getUserProjects(userId: string) {
  const rows = await sql`
    SELECT p.*,
      (SELECT COUNT(*)::int FROM projectshub.project_members pm2 WHERE pm2.project_id = p.id) AS member_count,
      pm.role AS my_role
    FROM projectshub.projects p
    JOIN projectshub.project_members pm ON pm.project_id = p.id AND pm.user_id = ${userId}
    ORDER BY p.status = 'active' DESC, p.created_at DESC
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({ ...mapProject(r), myRole: r.my_role as string }));
}

// --- Milestones ---

export async function getProjectMilestones(projectId: string) {
  const rows = await sql`
    SELECT * FROM projectshub.project_milestones
    WHERE project_id = ${projectId}
    ORDER BY target_date ASC NULLS LAST, created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map(mapMilestone);
}

export async function createMilestone(projectId: string, data: { title: string; description?: string; targetDate?: string }) {
  const rows = await sql`
    INSERT INTO projectshub.project_milestones (project_id, title, description, target_date)
    VALUES (${projectId}, ${data.title}, ${data.description ?? null}, ${data.targetDate ?? null})
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function updateMilestone(id: string, data: { title?: string; description?: string; targetDate?: string; status?: string }) {
  const completedAt = data.status === "completed" ? "now()" : null;
  await sql`
    UPDATE projectshub.project_milestones SET
      title = COALESCE(${data.title ?? null}, title),
      description = COALESCE(${data.description ?? null}, description),
      target_date = COALESCE(${data.targetDate ?? null}, target_date),
      status = COALESCE(${data.status ?? null}, status),
      completed_at = CASE WHEN ${data.status ?? null} = 'completed' THEN now() ELSE completed_at END
    WHERE id = ${id}
  `;
}

export async function deleteMilestone(id: string) {
  await sql`DELETE FROM projectshub.project_milestones WHERE id = ${id}`;
}

// --- Channels ---

export async function getProjectChannels(projectId: string) {
  const rows = await sql`
    SELECT c.*,
      (SELECT COUNT(*)::int FROM projectshub.messages m WHERE m.channel_id = c.id) AS message_count
    FROM projectshub.channels c
    WHERE c.project_id = ${projectId}
    ORDER BY c.name = 'General' DESC, c.created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map(mapChannel);
}

export async function createChannel(projectId: string, name: string) {
  const rows = await sql`
    INSERT INTO projectshub.channels (project_id, name)
    VALUES (${projectId}, ${name})
    RETURNING id
  `;
  return rows[0].id as string;
}

// --- Messages ---

export async function getChannelMessages(channelId: string, opts: { page?: number; limit?: number } = {}) {
  const limit = opts.limit ?? 50;
  const page = opts.page ?? 1;
  const offset = (page - 1) * limit;

  const rows = await sql`
    SELECT m.*, u.name AS user_name, u.avatar_url AS user_avatar,
      pm.body AS parent_body, pu.name AS parent_user_name
    FROM projectshub.messages m
    JOIN auth.users u ON u.id = m.user_id
    LEFT JOIN projectshub.messages pm ON pm.id = m.parent_id
    LEFT JOIN auth.users pu ON pu.id = pm.user_id
    WHERE m.channel_id = ${channelId}
    ORDER BY m.created_at ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countRows = await sql`SELECT COUNT(*)::int AS total FROM projectshub.messages WHERE channel_id = ${channelId}`;
  const total = (countRows[0]?.total as number) ?? 0;

  return { messages: (rows as Record<string, unknown>[]).map(mapMessage), total, page, limit };
}

export async function sendMessage(channelId: string, userId: string, body: string, parentId?: string) {
  const rows = await sql`
    INSERT INTO projectshub.messages (channel_id, user_id, body, parent_id)
    VALUES (${channelId}, ${userId}, ${body}, ${parentId ?? null})
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function togglePin(messageId: string) {
  const rows = await sql`
    UPDATE projectshub.messages SET pinned = NOT pinned WHERE id = ${messageId} RETURNING pinned
  `;
  return rows[0]?.pinned as boolean;
}

export async function getPinnedMessages(channelId: string) {
  const rows = await sql`
    SELECT m.*, u.name AS user_name, u.avatar_url AS user_avatar
    FROM projectshub.messages m
    JOIN auth.users u ON u.id = m.user_id
    WHERE m.channel_id = ${channelId} AND m.pinned = true
    ORDER BY m.created_at DESC
  `;
  return (rows as Record<string, unknown>[]).map(mapMessage);
}

export async function getChannelProjectId(channelId: string): Promise<string | null> {
  const rows = await sql`SELECT project_id FROM projectshub.channels WHERE id = ${channelId}`;
  return (rows[0]?.project_id as string) ?? null;
}

export async function getProjectMemberAvatars(projectId: string, limit = 5) {
  const rows = await sql`
    SELECT u.name, u.avatar_url
    FROM projectshub.project_members pm
    JOIN auth.users u ON u.id = pm.user_id
    WHERE pm.project_id = ${projectId}
    ORDER BY pm.role = 'lead' DESC, pm.assigned_at ASC
    LIMIT ${limit}
  `;
  return rows as { name: string; avatar_url: string | null }[];
}
