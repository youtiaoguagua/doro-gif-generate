// Cloudflare Workers 脚本 - 处理云端预设 API
// 部署到 Cloudflare Workers 并绑定 KV 命名空间

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname
    
    // 设置 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // 获取所有预设列表
      if (path === '/api/presets' && request.method === 'GET') {
        return await getPresets(env, corsHeaders)
      }
      
      // 上传新预设
      if (path === '/api/presets' && request.method === 'POST') {
        return await uploadPreset(request, env, corsHeaders)
      }
      
      // 获取特定预设详情
      if (path.startsWith('/api/presets/') && request.method === 'GET' && !path.endsWith('/download')) {
        const presetId = path.split('/')[3]
        return await getPresetDetail(presetId, env, corsHeaders)
      }
      
      // 增加下载计数
      if (path.endsWith('/download') && request.method === 'POST') {
        const presetId = path.split('/')[3]
        return await incrementDownload(presetId, env, corsHeaders)
      }
      
      // 删除预设
      if (path.startsWith('/api/presets/') && request.method === 'DELETE') {
        const presetId = path.split('/')[3]
        return await deletePreset(presetId, env, corsHeaders)
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders })
      
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  },
}

// 获取预设列表
async function getPresets(env, corsHeaders) {
  try {
    // 从 KV 获取预设索引
    const indexData = await env.PRESET_STORE.get('preset-index')
    const presets = indexData ? JSON.parse(indexData) : []
    
    // 按下载量排序
    presets.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    
    return new Response(JSON.stringify({ presets }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting presets:', error)
    return new Response(JSON.stringify({ presets: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 上传新预设
async function uploadPreset(request, env, corsHeaders) {
  try {
    const presetData = await request.json()
    
    // 检查数据大小 - KV 每个值限制 25MB
    const dataSize = JSON.stringify(presetData).length
    const maxSize = 25 * 1024 * 1024 // 25MB
    
    if (dataSize > maxSize) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '预设数据过大，请优化图片后重试（限制 25MB）'
      }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 生成唯一 ID
    const presetId = generateId()
    const timestamp = new Date().toISOString()
    
    // 准备预设元数据
    const presetMeta = {
      id: presetId,
      name: presetData.name || `预设-${presetId}`,
      description: presetData.description || '',
      author: presetData.author || 'anonymous',
      tags: presetData.tags || [],
      downloads: 0,
      createdAt: timestamp,
      frames: presetData.frames ? presetData.frames.length : 0,
      hasCustomImages: presetData.imageData ? true : false,
      dataSize: Math.round(dataSize / 1024), // KB
      previewGif: presetData.previewGif || null
    }
    
    // 保存完整预设数据
    await env.PRESET_STORE.put(`preset-${presetId}`, JSON.stringify(presetData))
    
    // 更新预设索引
    const indexData = await env.PRESET_STORE.get('preset-index')
    const presets = indexData ? JSON.parse(indexData) : []
    presets.unshift(presetMeta)
    
    // 限制索引大小（最多保存 1000 个预设）
    if (presets.length > 1000) {
      const removedPreset = presets.pop()
      // 删除旧预设数据
      await env.PRESET_STORE.delete(`preset-${removedPreset.id}`)
    }
    
    await env.PRESET_STORE.put('preset-index', JSON.stringify(presets))
    
    return new Response(JSON.stringify({ 
      success: true, 
      id: presetId,
      message: presetData.imageData ? '预设（含自定义图片）上传成功' : '预设上传成功',
      dataSize: Math.round(dataSize / 1024)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error uploading preset:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: '上传失败' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 获取预设详情
async function getPresetDetail(presetId, env, corsHeaders) {
  try {
    const presetData = await env.PRESET_STORE.get(`preset-${presetId}`)
    
    if (!presetData) {
      return new Response(JSON.stringify({ error: '预设不存在' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(presetData, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error getting preset detail:', error)
    return new Response(JSON.stringify({ error: '获取预设失败' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 增加下载计数
async function incrementDownload(presetId, env, corsHeaders) {
  try {
    // 更新索引中的下载计数
    const indexData = await env.PRESET_STORE.get('preset-index')
    if (indexData) {
      const presets = JSON.parse(indexData)
      const presetIndex = presets.findIndex(p => p.id === presetId)
      
      if (presetIndex !== -1) {
        presets[presetIndex].downloads = (presets[presetIndex].downloads || 0) + 1
        await env.PRESET_STORE.put('preset-index', JSON.stringify(presets))
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error incrementing download:', error)
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 删除预设
async function deletePreset(presetId, env, corsHeaders) {
  try {
    // 检查预设是否存在
    const presetData = await env.PRESET_STORE.get(`preset-${presetId}`)
    if (!presetData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '预设不存在' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 从KV存储中删除预设数据
    await env.PRESET_STORE.delete(`preset-${presetId}`)

    // 更新预设索引，移除该预设
    const indexData = await env.PRESET_STORE.get('preset-index')
    if (indexData) {
      const presets = JSON.parse(indexData)
      const filteredPresets = presets.filter(p => p.id !== presetId)
      await env.PRESET_STORE.put('preset-index', JSON.stringify(filteredPresets))
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: '预设删除成功'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error deleting preset:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: '删除失败' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
} 