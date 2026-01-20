import { prisma } from './prisma'

export async function getStories() {
  return await prisma.story.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
}

export async function getAllStories() {
  return await prisma.story.findMany({
    orderBy: { order: 'asc' },
  })
}

export async function updateStory(id: number, updates: any) {
  // Garantir que strings vazias sejam convertidas para null
  const data: any = { ...updates }
  if (data.image !== undefined) {
    data.image = data.image && typeof data.image === 'string' && data.image.trim() !== '' ? data.image : null
  }
  if (data.video !== undefined) {
    data.video = data.video && typeof data.video === 'string' && data.video.trim() !== '' ? data.video : null
  }
  
  return await prisma.story.update({
    where: { id },
    data,
  })
}

export async function addStory(story: any) {
  const maxOrder = await prisma.story.aggregate({
    _max: { order: true },
  })
  
  // Garantir que strings vazias sejam convertidas para null
  const imageValue = story.image && typeof story.image === 'string' && story.image.trim() !== '' ? story.image : null
  const videoValue = story.video && typeof story.video === 'string' && story.video.trim() !== '' ? story.video : null
  
  return await prisma.story.create({
    data: {
      title: story.title || '',
      image: imageValue,
      video: videoValue,
      alt: story.alt || '',
      active: story.active !== undefined ? story.active : true,
      order: story.order || (maxOrder._max.order ? maxOrder._max.order + 1 : 1),
    },
  })
}

export async function deleteStory(id: number) {
  await prisma.story.delete({
    where: { id },
  })
  return true
}
