<template>
  <div id="app">
    <div class="header">
      <h1>Doro编辑器</h1>
    </div>

    <div class="main-container">
              <!-- 左侧：图片帧列表 -->
      <div class="frames-panel">
        <h3>图片帧 ({{ frames.length }}帧)</h3>
        <div class="frames-grid">
          <div 
            v-for="(frame, index) in frames" 
            :key="index"
            class="frame-item"
            :class="{ active: currentFrameIndex === index }"
            @click="selectFrame(index)"
          >
            <img :src="frame.src" :alt="`帧 ${index + 1}`" />
            <span class="frame-number">{{ index + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- 中间：编辑区域 -->
      <div class="editor-panel">
        <div class="editor-header">
          <h3>编辑帧 {{ currentFrameIndex + 1 }} {{ hasCustomImages ? '(自定义图片)' : '(默认图片)' }}</h3>
          <div class="controls">
            <button @click="addText" class="btn btn-primary">
              <span>➕</span> 添加文字
            </button>
            <button @click="toggleDrawing" class="btn" :class="isDrawingMode ? 'btn-warning' : 'btn-outline'">
              <span>🖌️</span> {{ isDrawingMode ? '停止画笔' : '画笔工具' }}
            </button>
            <button @click="togglePlay" class="btn" :class="isPlaying ? 'btn-warning' : 'btn-info'">
              <span>{{ isPlaying ? '⏸️' : '▶️' }}</span> {{ isPlaying ? '暂停' : '播放' }}
            </button>
            <button @click="previewGif" class="btn btn-secondary" :disabled="isGenerating">
              <span>👁️</span> 预览GIF
            </button>
            <button @click="generateGif" class="btn btn-success" :disabled="isGenerating">
              <span>⬇️</span> {{ isGenerating ? '生成中...' : '生成GIF' }}
            </button>
          </div>
        </div>
        
        <div class="canvas-container">
          <canvas 
            ref="canvas" 
            :width="canvasSize.width" 
            :height="canvasSize.height"
            @click="handleCanvasClick"
          ></canvas>
        </div>
        
        <!-- 帧导航控制 -->
        <div class="frame-controls">
          <button @click="prevFrame" class="btn btn-outline" :disabled="isPlaying">
            <span>⏮️</span> 上一帧
          </button>
          
          <div class="frame-info">
            <span class="current-frame">第 {{ currentFrameIndex + 1 }} 帧 / {{ frames.length }} 帧</span>
            <span v-if="isPlaying" class="playing-indicator">🔄 播放中</span>
          </div>
          
          <button @click="nextFrame" class="btn btn-outline" :disabled="isPlaying">
            <span>⏭️</span> 下一帧
          </button>
        </div>
      </div>

      <!-- 右侧：文字设置 -->
      <div class="settings-panel">
        <!-- 项目管理 -->
        <div class="project-management">
          <h3>项目管理</h3>
          <div class="project-buttons">
            <button @click="showImageUpload" class="btn btn-info btn-sm">
              🖼️ 上传图片
            </button>
            <button @click="showSaveProjectModal" class="btn btn-primary btn-sm">
              💾 保存项目
            </button>
            <button @click="showLoadProjectModal" class="btn btn-info btn-sm">
              📁 加载项目
            </button>
            <button @click="importProject" class="btn btn-secondary btn-sm">
              📥 导入项目
            </button>
            <button @click="showCloudPresets" class="btn btn-success btn-sm">
                              ⭐ 精选预设
            </button>
            <button @click="showUploadPreset" class="btn btn-warning btn-sm">
              📤 分享预设
            </button>
          </div>
        </div>

        <h3>文字设置</h3>
        
        <div v-if="selectedTextIndex !== -1" class="text-settings">
          <div class="setting-group">
            <label>文字内容:</label>
            <textarea 
              v-model="currentText.text" 
              @input="updateText"
              placeholder="输入文字内容"
              rows="2"
            ></textarea>
          </div>

          <div class="setting-group">
            <label>字体大小: {{ currentText.fontSize }}px</label>
            <input 
              type="range" 
              v-model="currentText.fontSize" 
              @input="updateText"
              min="12" 
              max="100" 
              step="2"
            />
          </div>

          <div class="setting-group">
            <label>字体颜色:</label>
            <input 
              type="color" 
              v-model="currentText.fill" 
              @change="updateText"
            />
          </div>

          <div class="setting-group">
            <label>字体样式:</label>
            <select v-model="currentText.fontFamily" @change="updateText">
              <option value="Arial">Arial</option>
              <option value="Microsoft YaHei">微软雅黑</option>
              <option value="SimHei">黑体</option>
              <option value="SimSun">宋体</option>
              <option value="KaiTi">楷体</option>
            </select>
          </div>

          <div class="setting-group">
            <label>字体粗细:</label>
            <select v-model="currentText.fontWeight" @change="updateText">
              <option value="normal">正常</option>
              <option value="bold">粗体</option>
            </select>
          </div>

          <div class="setting-group">
            <label>描边宽度: {{ currentText.strokeWidth }}px</label>
            <input 
              type="range" 
              v-model="currentText.strokeWidth" 
              @input="updateText"
              min="0" 
              max="5" 
              step="1"
            />
          </div>

          <div v-if="currentText.strokeWidth > 0" class="setting-group">
            <label>描边颜色:</label>
            <input 
              type="color" 
              v-model="currentText.stroke" 
              @change="updateText"
            />
          </div>

          <div class="setting-group">
            <button @click="deleteSelectedText" class="btn btn-danger">
              <span>🗑️</span> 删除文字
            </button>
          </div>
        </div>

        <div v-else class="no-text-selected">
          <p>点击画布添加文字，或选择已有文字进行编辑</p>
        </div>

        <!-- 文字列表 -->
        <div v-if="currentFrame.texts.length > 0" class="texts-list">
          <h4>文字列表:</h4>
          <div 
            v-for="(text, index) in currentFrame.texts" 
            :key="index"
            class="text-item"
            :class="{ active: selectedTextIndex === index }"
            @click="selectText(index)"
          >
            <span class="text-preview">{{ text.text.slice(0, 10) }}{{ text.text.length > 10 ? '...' : '' }}</span>
          </div>
        </div>

        <!-- 画笔设置 -->
        <div class="brush-settings">
          <h3>画笔工具</h3>
          
          <div class="setting-group">
            <button @click="toggleDrawing" class="btn" :class="isDrawingMode ? 'btn-warning' : 'btn-primary'">
              <span>🖌️</span> {{ isDrawingMode ? '停止画笔' : '开启画笔' }}
            </button>
          </div>

          <div v-if="isDrawingMode" class="brush-controls">
            <div class="setting-group">
              <label>画笔大小: {{ brushSize }}px</label>
              <input 
                type="range" 
                v-model="brushSize" 
                @input="updateBrushSettings"
                min="1" 
                max="50" 
                step="1"
              />
            </div>

            <div class="setting-group">
              <label>画笔颜色:</label>
              <input 
                type="color" 
                v-model="brushColor" 
                @change="updateBrushSettings"
              />
            </div>

            <div class="setting-group">
              <label>透明度: {{ Math.round(brushOpacity * 100) }}%</label>
              <input 
                type="range" 
                v-model="brushOpacity" 
                @input="updateBrushSettings"
                min="0.1" 
                max="1" 
                step="0.1"
              />
            </div>

            <div class="setting-group">
              <button @click="clearDrawings" class="btn btn-danger btn-sm">
                <span>🗑️</span> 清除涂鸦
              </button>
            </div>
          </div>
        </div>

        <!-- 全局设置 -->
        <div class="global-settings">
          <h4>全局设置:</h4>
          <div class="setting-group">
            <label>GIF延迟: {{ gifDelay }}ms</label>
            <input 
              type="range" 
              v-model="gifDelay" 
              min="50" 
              max="500" 
              step="10"
            />
          </div>
          <div class="setting-group">
            <label>帧播放顺序:</label>
            <select v-model="frameOrder" @change="onFrameOrderChange">
              <option value="normal">正序播放 (1→2→3→4...)</option>
              <option value="reverse">倒序播放 (4→3→2→1...)</option>
            </select>
          </div>
          <div class="setting-group">
            <button @click="applyToAllFrames" class="btn btn-secondary">
              <span>📋</span> 应用到其他帧
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <div v-if="showPreview" class="modal-overlay" @click="closePreview">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>GIF预览</h3>
          <button @click="closePreview" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <img v-if="previewUrl" :src="previewUrl" alt="GIF预览" />
          <p v-else>生成预览中...</p>
        </div>
      </div>
    </div>

    <!-- 应用范围选择模态框 -->
    <div v-if="showApplyModal" class="modal-overlay" @click="closeApplyModal">
      <div class="modal-content apply-modal" @click.stop>
        <div class="modal-header">
          <h3>选择应用范围</h3>
          <button @click="closeApplyModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="apply-info">
            <p>将当前帧（第 {{ currentFrameIndex + 1 }} 帧）的内容应用到指定范围：</p>
            
            <!-- 调试信息 (开发模式可见) -->
            <div v-if="false" class="debug-info" style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-size: 12px; border-radius: 4px;">
              <p>调试信息：</p>
              <p>文字数量: {{ currentFrame.texts.length }}</p>
              <p>涂抹数量: {{ currentFrame.drawings ? currentFrame.drawings.length : 'undefined' }}</p>
              <p>涂抹数据: {{ JSON.stringify(currentFrame.drawings) }}</p>
            </div>
            
            <!-- 应用内容选择 -->
            <div class="apply-content-selection">
              <!-- 当前帧没有任何内容时的提示 -->
              <div v-if="currentFrame.texts.length === 0 && (!currentFrame.drawings || currentFrame.drawings.length === 0)" class="no-any-content">
                <p>😅 当前帧暂无文字或涂抹内容</p>
                <p>你可以先添加一些文字或使用画笔工具涂抹，然后再来应用到其他帧。</p>
                <div class="debug-actions">
                  <button @click="forceRefreshDrawings" class="btn btn-outline btn-sm" style="margin-top: 10px;">
                    🔄 刷新涂抹状态
                  </button>
                </div>
              </div>
              
              <!-- 有内容时的选择 -->
              <div v-else>
                <div class="content-option">
                  <label>
                    <input type="checkbox" v-model="applyTexts" :disabled="currentFrame.texts.length === 0" />
                    应用文字
                  </label>
                  <div v-if="applyTexts && currentFrame.texts.length > 0" class="content-preview">
                    <div v-for="(text, index) in currentFrame.texts" :key="index" class="text-preview-item">
                      "{{ text.text.slice(0, 20) }}{{ text.text.length > 20 ? '...' : '' }}"
                    </div>
                  </div>
                  <div v-if="currentFrame.texts.length === 0" class="no-content">
                    当前帧暂无文字
                  </div>
                </div>
                
                <div class="content-option">
                  <label>
                    <input type="checkbox" v-model="applyDrawings" :disabled="!currentFrame.drawings || currentFrame.drawings.length === 0" />
                    应用涂抹
                  </label>
                  <div v-if="applyDrawings && currentFrame.drawings && currentFrame.drawings.length > 0" class="content-preview">
                    当前帧有 {{ currentFrame.drawings.length }} 个涂抹路径
                  </div>
                  <div v-if="!currentFrame.drawings || currentFrame.drawings.length === 0" class="no-content">
                    当前帧暂无涂抹
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="range-settings">
            <div class="setting-group">
              <label>起始帧:</label>
              <div class="range-input">
                <input 
                  type="number" 
                  v-model.number="applyStartFrame" 
                  min="0" 
                  :max="frames.length - 1"
                  @change="validateRange"
                />
                <span class="frame-label">第 {{ applyStartFrame + 1 }} 帧</span>
              </div>
            </div>

            <div class="setting-group">
              <label>结束帧:</label>
              <div class="range-input">
                <input 
                  type="number" 
                  v-model.number="applyEndFrame" 
                  :min="applyStartFrame" 
                  :max="frames.length - 1"
                  @change="validateRange"
                />
                <span class="frame-label">第 {{ applyEndFrame + 1 }} 帧</span>
              </div>
            </div>

            <div class="range-preview">
              <p>将应用到 {{ Math.abs(applyEndFrame - applyStartFrame) + 1 }} 帧 (第 {{ applyStartFrame + 1 }} - {{ applyEndFrame + 1 }} 帧)</p>
            </div>
          </div>

          <div class="quick-options">
            <h4>快速选择：</h4>
            <div class="quick-buttons">
              <button @click="setRange(0, frames.length - 1)" class="btn btn-outline btn-sm">
                全部帧 (1-{{ frames.length }})
              </button>
              <button @click="setRange(0, Math.floor(frames.length / 2) - 1)" class="btn btn-outline btn-sm">
                前半部分 (1-{{ Math.floor(frames.length / 2) }})
              </button>
              <button @click="setRange(Math.floor(frames.length / 2), frames.length - 1)" class="btn btn-outline btn-sm">
                后半部分 ({{ Math.floor(frames.length / 2) + 1 }}-{{ frames.length }})
              </button>
              <button @click="setRange(currentFrameIndex, currentFrameIndex)" class="btn btn-outline btn-sm">
                仅当前帧 ({{ currentFrameIndex + 1 }})
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeApplyModal" class="btn btn-secondary">取消</button>
            <button 
              @click="applyToFrameRange" 
              class="btn btn-primary" 
              :disabled="(!applyTexts && !applyDrawings) || (currentFrame.texts.length === 0 && (!currentFrame.drawings || currentFrame.drawings.length === 0))"
            >
              应用到选定范围
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存项目模态框 -->
    <div v-if="showSaveModal" class="modal-overlay" @click="closeSaveModal">
      <div class="modal-content save-modal" @click.stop>
        <div class="modal-header">
          <h3>保存项目</h3>
          <button @click="closeSaveModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="setting-group">
            <label>项目名称:</label>
            <input 
              type="text" 
              v-model="currentProjectName" 
              placeholder="请输入项目名称"
              maxlength="50"
              @keyup.enter="saveCurrentProject"
            />
          </div>
          <p class="save-info">
            将保存当前所有帧的文字内容、涂抹路径、位置、样式以及全局设置
          </p>
          <div class="modal-actions">
            <button @click="closeSaveModal" class="btn btn-secondary">取消</button>
            <button @click="saveCurrentProject" class="btn btn-primary" :disabled="!currentProjectName.trim()">
              💾 保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载项目模态框 -->
    <div v-if="showLoadModal" class="modal-overlay" @click="closeLoadModal">
      <div class="modal-content load-modal" @click.stop>
        <div class="modal-header">
          <h3>加载项目</h3>
          <button @click="closeLoadModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="savedProjects.length === 0" class="no-projects">
            <p>暂无保存的项目</p>
            <p>你可以通过 "导入项目" 导入其他项目文件</p>
          </div>
          
          <div v-else class="projects-list">
            <div 
              v-for="(project, index) in savedProjects" 
              :key="index"
              class="project-item"
            >
              <div class="project-info">
                <h4>{{ project.name }}</h4>
                <p class="project-details">
                  保存时间: {{ formatDate(project.savedAt) }}
                </p>
                <p class="project-details">
                  帧数: {{ project.frames.length }} | 延迟: {{ project.settings.gifDelay }}ms
                </p>
                <p class="project-details" v-if="project.downloadedFrom" style="font-size: 12px; color: #007bff;">
                  📥 来自云端预设
                </p>
              </div>
                             <div class="project-actions">
                <button @click="loadProject(project)" class="btn btn-primary btn-sm" title="加载项目并可选择替换文字内容">
                  🔄 替换文字加载
                </button>
                <button @click="loadProjectDirectly(project)" class="btn btn-success btn-sm" title="完整加载项目（包含图片、文字、涂抹）">
                  📁 直接加载
                </button>
                <button @click="applyProjectAsPreset(project)" class="btn btn-warning btn-sm" title="只应用文字和涂抹到当前图片">
                  🎨 应用预设
                </button>
                <button @click="exportProject(project)" class="btn btn-info btn-sm">
                  📤 导出
                </button>
                <button @click="deleteProject(project, index)" class="btn btn-danger btn-sm">
                  🗑️ 删除
                </button>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeLoadModal" class="btn btn-secondary">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文字替换模态框 -->
    <div v-if="showTextReplaceModal" class="modal-overlay" @click="closeTextReplaceModal">
      <div class="modal-content text-replace-modal" @click.stop>
        <div class="modal-header">
          <h3>文字替换 - {{ selectedProject?.name }}</h3>
          <button @click="closeTextReplaceModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="replace-info">
            <p>🔄 你可以快速替换项目中的文字内容，保持原有的位置和样式</p>
            <p>📝 找到 <strong>{{ textReplacements.length }}</strong> 个不同的文字需要替换：</p>
          </div>

          <div v-if="textReplacements.length > 0" class="text-replacements">
            <div 
              v-for="(item, index) in textReplacements" 
              :key="index"
              class="replacement-item"
            >
              <div class="replacement-row">
                <div class="original-text">
                  <label>原文字:</label>
                  <div class="text-preview">{{ item.preview }}</div>
                </div>
                <div class="arrow">→</div>
                <div class="new-text">
                  <label>新文字:</label>
                  <div class="input-group">
                    <textarea 
                      v-model="item.replacement" 
                      placeholder="输入新的文字内容"
                      rows="2"
                      maxlength="200"
                    ></textarea>
                    <button @click="quickFillText(index)" class="btn btn-outline btn-xs" title="快速填充">
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-text">
            <p>该项目中没有找到文字内容</p>
          </div>

          <div class="modal-actions">
            <button @click="closeTextReplaceModal" class="btn btn-secondary">取消</button>
            <button @click="loadProjectDirectly(selectedProject)" class="btn btn-outline">
              📁 不替换，直接加载
            </button>
            <button @click="loadProjectWithReplacements" class="btn btn-primary" :disabled="textReplacements.length === 0">
              🔄 替换并加载
            </button>
          </div>
        </div>
      </div>
    </div>

            <!-- 精选预设浏览模态框 -->
    <div v-if="showCloudModal" class="modal-overlay" @click="closeCloudModal">
      <div class="modal-content cloud-modal" @click.stop>
        <div class="modal-header">
          <h3>⭐ 精选预设库</h3>
          <button @click="closeCloudModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="cloud-info">
            <p>🌟 发现和下载其他用户分享的精美模板</p>
          </div>

          <div v-if="isLoadingCloud" class="loading">
            <p>🔄 正在加载精选预设...</p>
          </div>

          <div v-else-if="cloudPresets.length === 0" class="no-cloud-presets">
            <p>😔 暂无精选预设</p>
            <p>成为第一个分享预设的用户吧！</p>
          </div>

          <div v-else class="cloud-presets-grid">
            <div 
              v-for="preset in cloudPresets" 
              :key="preset.id"
              class="preset-card"
              @click="showPresetDetails(preset)"
            >
              <div class="preset-card-preview">
                <img 
                  v-if="preset.previewGif" 
                  :src="preset.previewGif" 
                  alt="预设预览" 
                  class="card-gif-preview" 
                />
                <div v-else class="no-preview">🎞️</div>
                
                <div class="preset-card-overlay">
                  <div class="quick-stats">
                    <span class="downloads">📥 {{ preset.downloads }}</span>
                    <span class="frames">{{ preset.frames }}帧</span>
                  </div>
                </div>
              </div>
              
              <div class="preset-card-content">
                <h4 class="preset-card-title">{{ preset.name }}</h4>
                <p class="preset-card-description">{{ preset.description }}</p>
                

                
                <div class="preset-card-footer">
                  <span class="preset-author">👤 {{ preset.author }}</span>
                  <div class="preset-card-actions" @click.stop>
                    <button @click="downloadCloudPreset(preset)" class="btn-icon" title="下载预设">
                      📥
                    </button>
                    <button @click="deleteCloudPreset(preset)" class="btn-icon btn-danger" title="删除预设">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeCloudModal" class="btn btn-secondary">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传预设模态框 -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content upload-modal" @click.stop>
        <div class="modal-header">
          <h3>⭐ 分享到精选预设</h3>
          <button @click="closeUploadModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="upload-info">
            <p>🌟 将你的创意分享给全世界！</p>
            <p>📝 当前项目包含 {{ frames.length }} 帧和 {{ frames.reduce((total, frame) => total + frame.texts.length, 0) }} 个文字</p>
          </div>

          <div class="upload-form">
            <div class="upload-preview-section">
              <div class="current-gif-preview">
                <h4>预设预览:</h4>
                <div class="gif-preview-container" ref="previewContainer">
                  <canvas ref="previewCanvas" class="preview-canvas" style="display: none;"></canvas>
                  <div class="preview-loading">🔄 正在生成预览...</div>
                </div>
              </div>
              
              <div class="upload-details">
                <div class="setting-group">
                  <label>预设标题 *:</label>
                  <input 
                    type="text"
                    v-model="uploadTitle" 
                    placeholder="给你的预设起个好听的名字..."
                    maxlength="50"
                    required
                  />
                  <small>{{ uploadTitle.length }}/50 字符</small>
                </div>

                <div class="setting-group">
                  <label>预设描述 *:</label>
                  <textarea 
                    v-model="uploadDescription" 
                    placeholder="请描述这个预设的用途和特点..."
                    rows="3"
                    maxlength="200"
                    required
                  ></textarea>
                  <small>{{ uploadDescription.length }}/200 字符</small>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeUploadModal" class="btn btn-secondary">取消</button>
            <button 
              @click="uploadCurrentProject" 
              class="btn btn-success" 
              :disabled="!uploadTitle.trim() || !uploadDescription.trim() || isUploading"
            >
              {{ isUploading ? '⭐ 分享中...' : '⭐ 分享到精选' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片上传模态框 -->
    <div v-if="showUploadImageModal" class="modal-overlay" @click="closeImageUpload">
      <div class="modal-content upload-image-modal" @click.stop>
        <div class="modal-header">
          <h3>🖼️ 上传自定义图片</h3>
          <button @click="closeImageUpload" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="upload-image-info">
            <p>🎨 上传你自己的图片来创建独特的 GIF！</p>
            <p>🎞️ <strong>GIF 文件</strong>：自动解析所有帧，保持原始动画效果</p>
            <p>🖼️ <strong>静态图片</strong>：PNG、JPG 等格式，建议尺寸：400x400 像素</p>
          </div>

          <div v-if="isProcessingImage" class="processing">
            <p>🔄 正在处理图片，请稍候...</p>
          </div>

          <div v-else class="upload-zone">
            <input 
              type="file" 
              ref="imageInput"
              @change="handleImageUpload"
              accept="image/*"
              style="display: none"
            />
            <div 
              class="drop-zone"
              @click="$refs.imageInput.click()"
              @dragover.prevent
              @drop.prevent="handleImageDrop"
            >
              <div class="drop-content">
                <span class="upload-icon">📁</span>
                <p>点击选择图片或拖拽到此处</p>
                <small>支持动态 GIF（自动解析帧）、PNG、JPG 格式</small>
              </div>
            </div>
          </div>

          <div class="current-image-info" v-if="hasCustomImages">
            <h4>当前图片信息:</h4>
            <p>类型: {{ getImageTypeDisplay() }}</p>
            <p>尺寸: {{ canvasSize.width }}x{{ canvasSize.height }}</p>
            <p>帧数: {{ frames.length }}</p>
            <p v-if="originalImageData?.gifInfo">原始 GIF: {{ originalImageData.gifInfo.frameCount }} 帧</p>
          </div>

          <div class="modal-actions">
            <button @click="closeImageUpload" class="btn btn-secondary">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="footer">
      <p>Powered by <span class="signature">youtiaoguagua</span></p>
    </div>
  </div>
</template>

<script>
import { Canvas, FabricText, FabricImage, Path, PencilBrush } from 'fabric'
import { encode } from 'modern-gif'
import { saveAs } from 'file-saver'
import { parseGIF, decompressFrames } from 'gifuct-js'
import axios from 'axios'
import { GifReader } from 'omggif'

export default {
  name: 'App',
  data() {
    return {
      frames: [],
      currentFrameIndex: 0,
      canvas: null,
      fabricCanvas: null,
      selectedTextIndex: -1,
      canvasSize: { width: 400, height: 400 },
      isGenerating: false,
      showPreview: false,
      previewUrl: '',
      gifDelay: 80,
      frameOrder: 'normal', // 帧播放顺序：'normal' 正序，'reverse' 倒序
      // 播放控制
      isPlaying: false,
      playTimer: null,
      // 应用范围控制
      showApplyModal: false,
      applyStartFrame: 0,
      applyEndFrame: 0,
      applyTexts: true,
      applyDrawings: true,
      // 项目保存/加载
      showSaveModal: false,
      showLoadModal: false,
      savedProjects: [],
      currentProjectName: '',
      selectedProject: null,
      showTextReplaceModal: false,
      textReplacements: [],
      // 精选预设功能
      showCloudModal: false,
      cloudPresets: [],
      isLoadingCloud: false,
      showUploadModal: false,
      uploadTitle: '',
      uploadDescription: '',
      isUploading: false,
      // 图片上传功能
      showUploadImageModal: false,
      isProcessingImage: false,
      hasCustomImages: false,
      originalImageData: null, // 存储原始图片数据用于分享
      defaultImageSrc: '/preset/kick.gif', // 默认图片路径 (public 目录)
      // Cloudflare Worker 配置
              workerApiUrl: 'https://doro-api.20491504.xyz', // Cloudflare Worker API 域名
      defaultTextStyle: {
        text: '新文字',
        fontSize: 24,
        fill: '#000000',
        fontFamily: 'Microsoft YaHei',
        fontWeight: 'normal',
        strokeWidth: 0,
        stroke: '#ffffff',
        left: 200,
        top: 200
      },
      // 画笔工具
      isDrawingMode: false,
      brushSize: 10,
      brushColor: '#FF0000',
      brushOpacity: 1.0
    }
  },
  computed: {
    currentFrame() {
      return this.frames[this.currentFrameIndex] || { texts: [], drawings: [] }
    },
    currentText() {
      if (this.selectedTextIndex !== -1 && this.currentFrame.texts[this.selectedTextIndex]) {
        return this.currentFrame.texts[this.selectedTextIndex]
      }
      return { ...this.defaultTextStyle }
    }
  },
  async mounted() {
    console.log('Component mounted, starting frame loading...')
    try {
      // 加载已保存的项目列表
      this.loadSavedProjectsList()
      
      await this.loadFrames()
      console.log('Frames loaded successfully')
      
      // 确保所有帧都有drawings数组
      this.ensureFramesHaveDrawings()
      
      await this.$nextTick() // 确保DOM已渲染
      console.log('DOM updated, initializing canvas...')
      this.initCanvas()
      console.log('Canvas initialized')
    } catch (error) {
      console.error('Error during initialization:', error)
    }
  },

  beforeUnmount() {
    // 清理定时器
    this.stopPlay()
    
    // 清理画布
    if (this.fabricCanvas) {
      console.log('Disposing fabric canvas on unmount...')
      this.fabricCanvas.dispose()
      this.fabricCanvas = null
    }
  },

  watch: {
    // 监听GIF延迟变化，实时更新播放速度
    gifDelay(newDelay) {
      if (this.isPlaying) {
        // 重新启动播放以使用新的延迟
        this.stopPlay()
        this.$nextTick(() => {
          this.startPlay()
        })
      }
    }
  },
  methods: {
    // 确保所有帧都有drawings数组
    ensureFramesHaveDrawings() {
      this.frames.forEach(frame => {
        if (!frame.drawings) {
          frame.drawings = []
        }
      })
      console.log('已确保所有帧都有drawings数组')
    },

    async loadFrames() {
      console.log('开始加载帧...')
      
      // 如果有自定义图片数据，使用自定义图片
      if (this.originalImageData && this.originalImageData.frames) {
        console.log('使用自定义图片数据')
        this.frames = []
        
        try {
          for (let i = 0; i < this.originalImageData.frames.length; i++) {
            const frameData = this.originalImageData.frames[i]
            const img = new Image()
            img.src = frameData.dataUrl
            
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
            })
            
            this.frames.push({
              src: frameData.dataUrl,
              img: img,
              texts: frameData.texts || [],
              drawings: frameData.drawings || [],
              drawings: frameData.drawings || []
            })
          }
          console.log(`Loaded ${this.frames.length} custom frames`)
          return
        } catch (error) {
          console.error('自定义图片加载失败:', error)
          // 重置自定义图片数据，回退到默认
          this.originalImageData = null
          this.hasCustomImages = false
        }
      }

      // 使用默认图片 - 尝试加载 kick.gif 并解析帧
      try {
        console.log('尝试加载默认图片...')
        await this.loadDefaultFrames()
        console.log('默认图片加载成功')
      } catch (error) {
        console.error('Failed to load default frames:', error)
        console.log('回退到 kick.gif...')
        // 如果默认图片失败，fallback 到 kick.gif
        await this.loadDoroFrames()
      }
      
      // 最终检查
      if (this.frames.length === 0) {
        console.error('所有图片加载都失败了，创建空白帧')
        await this.createEmptyFrames()
      }
    },

    // 创建空白帧作为最后的备用方案
    async createEmptyFrames() {
      console.log('创建空白帧作为备用')
      this.frames = []
      this.canvasSize = { width: 400, height: 400 }
      
      // 创建一个白色的空白图片
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 400, 400)
      
      const dataUrl = canvas.toDataURL('image/png')
      
      // 创建 19 帧空白图片
      for (let i = 0; i < 19; i++) {
        const img = new Image()
        img.src = dataUrl
        
        await new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve // 即使失败也继续
        })
        
        this.frames.push({
          src: dataUrl,
          img: img,
          texts: [],
          drawings: []
        })
      }
      
      console.log(`创建了 ${this.frames.length} 个空白帧`)
    },

    async loadDefaultFrames() {
      // 尝试加载默认的 kick.gif
      // 使用优化的处理方式
      try {
        console.log('🎞️ 加载默认 GIF:', this.defaultImageSrc)
        console.log('📡 完整 URL:', window.location.origin + this.defaultImageSrc)
        
        const response = await axios.get(this.defaultImageSrc, {
          responseType: 'arraybuffer',
          headers: {
            'Accept': 'image/gif,image/*,*/*'
          }
        })
        
        console.log('📥 默认图片响应:', {
          status: response.status,
          dataLength: response.data.byteLength,
          contentType: response.headers['content-type']
        })
        
        if (response.status !== 200 || response.data.byteLength === 0) {
          throw new Error(`默认图片加载失败: ${response.status}`)
        }
        
        // 转换为 Blob 并使用优化处理
        const blob = new Blob([response.data], { type: 'image/gif' })
        console.log('🔄 创建 blob:', blob.size, 'bytes')
        
        // 使用优化的前端 GIF 处理
        console.log('🎯 使用前端 GIF 处理方式')
        await this.processGifOptimized(blob, false) // false 表示不是用户上传
        
        console.log('✅ 默认图片处理成功')
      } catch (error) {
        console.error('❌ 默认图片加载失败:', error)
        throw error
      }
    },

    async loadDoroFrames() {
      // 使用 kick.gif 作为默认图片
      console.log('开始加载默认 kick.gif...')
      
      try {
        // 直接处理 kick.gif 文件
        const response = await fetch('/preset/kick.gif')
        if (!response.ok) {
          throw new Error(`无法加载 kick.gif: ${response.status}`)
        }
        
        const gifBlob = await response.blob()
        console.log('✅ kick.gif 加载成功:', gifBlob.size, 'bytes')
        
        // 使用真正的拆帧方法处理 kick.gif
        const arrayBuffer = await gifBlob.arrayBuffer()
        await this.processGifOptimized(gifBlob, false)
        
        console.log(`✅ 默认图片加载完成: ${this.frames.length} 帧`)
        
      } catch (error) {
        console.error('❌ 加载 kick.gif 失败:', error)
        
        // 如果 kick.gif 也失败，创建空白帧
        await this.createEmptyFrames()
      }
    },

    // 图片上传和处理功能
    showImageUpload() {
      this.showUploadImageModal = true
    },

    closeImageUpload() {
      this.showUploadImageModal = false
    },

    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.processImageFile(file, true) // true 表示用户上传
      }
    },

    handleImageDrop(event) {
      const files = event.dataTransfer.files
      if (files.length > 0) {
        this.processImageFile(files[0], true)
      }
    },

    getImageTypeDisplay() {
      if (!this.originalImageData) return '自定义'
      
      switch (this.originalImageData.type) {
        case 'gif-omggif':
          return '动态 GIF（omggif解析）'
        case 'gif-supergif':
          return '动态 GIF（SuperGif解析）'
        case 'gif-gifuct':
          return '动态 GIF（完整解析）'
        case 'gif-simple':
          return '动态 GIF（简化处理）'
        case 'gif-worker-processed':
          return '动态 GIF（后端处理）'
        case 'gif-optimized':
          return '动态 GIF（优化处理）'
        case 'image':
          return '静态图片'
        default:
          return '自定义'
      }
    },

    async processImageFile(file, isUserUpload = true) {
      this.isProcessingImage = true
      
      try {
        console.log('开始处理图片文件:', file.name, file.type)
        const fileType = file.type || 'image/gif'
        
        if (fileType.includes('gif')) {
          console.log('检测到 GIF 文件，使用前端处理')
          await this.processGifOptimized(file, isUserUpload)
        } else {
          console.log('检测到静态图片，使用单图处理')
          await this.processSingleImage(file, isUserUpload)
        }
        
        // 检查是否成功处理了图片
        if (this.frames.length === 0) {
          throw new Error('图片处理后没有生成任何帧')
        }
        
        if (isUserUpload) {
          this.hasCustomImages = true
          this.showUploadImageModal = false
          console.log('图片处理成功，重新初始化画布')
          
          // 重新初始化画布
          await this.$nextTick()
          this.initCanvas()
        }
        
        console.log(`图片处理完成，共 ${this.frames.length} 帧`)
        
      } catch (error) {
        console.error('Error processing image:', error)
        
        // 如果是用户上传，重置状态并提示错误
        if (isUserUpload) {
          this.hasCustomImages = false
          this.originalImageData = null
          alert(`图片处理失败: ${error.message}。请尝试其他图片或格式。`)
          
          // 如果当前没有任何帧，回退到默认图片
          if (this.frames.length === 0) {
            console.log('回退到默认图片...')
            try {
              await this.loadDoroFrames()
              await this.$nextTick()
              this.initCanvas()
            } catch (fallbackError) {
              console.error('回退到默认图片也失败:', fallbackError)
              await this.createEmptyFrames()
              await this.$nextTick()
              this.initCanvas()
            }
          }
        }
      }
      
      this.isProcessingImage = false
    },

    // 已删除旧的 processGif 方法，现在使用 processGifOptimized

    // 已删除 Worker API 处理方法，现在使用前端处理

    // 优化的客户端 GIF 处理 - 使用omggif作为首选方案
    async processGifOptimized(dataSource, isUserUpload = true) {
      console.log('🎨 开始优化的 GIF 处理...')
      
      let arrayBuffer
      
      // 处理不同的数据源
      if (typeof dataSource === 'string' && dataSource.startsWith('data:')) {
        // base64 数据
        console.log('📋 处理 base64 数据')
        const response = await fetch(dataSource)
        arrayBuffer = await response.arrayBuffer()
      } else if (dataSource instanceof File || dataSource instanceof Blob) {
        // 文件或 Blob
        console.log('📁 处理文件数据')
        arrayBuffer = await dataSource.arrayBuffer()
      } else {
        throw new Error('不支持的数据源类型')
      }
      
      try {
        // 首先尝试使用omggif拆分GIF
        console.log('🚀 尝试使用omggif拆分GIF...')
        await this.processGifWithOmggif(arrayBuffer, isUserUpload)
        console.log('✅ omggif拆分成功')
        
      } catch (omggifError) {
        console.warn('⚠️ omggif 拆分失败，尝试SuperGif方案:', omggifError.message)
        
        try {
          // 尝试SuperGif方案
          await this.processGifFramesCorrectly(arrayBuffer, isUserUpload)
          console.log('✅ SuperGif拆分成功')
        } catch (gifError) {
          console.warn('⚠️ SuperGif 拆分失败，尝试 gifuct-js 简化方案:', gifError.message)
          
          try {
            // 尝试使用 gifuct-js 的简化方案
            await this.processGifWithGifuctSimple(arrayBuffer, isUserUpload)
          } catch (secondError) {
            console.warn('⚠️ gifuct-js 也失败，使用单帧备用方案:', secondError.message)
            // 如果拆分失败，使用单帧方案
            await this.processGifWithNativeVariations(new Blob([arrayBuffer], { type: 'image/gif' }), isUserUpload)
          }
        }
      }
    },

    // 使用omggif进行GIF帧拆分
    async processGifWithOmggif(arrayBuffer, isUserUpload = true) {
      console.log('🚀 使用omggif解析GIF...')
      
      try {
        // 创建Uint8Array用于omggif
        const bytes = new Uint8Array(arrayBuffer)
        
        // 创建GifReader实例
        const gifReader = new GifReader(bytes)
        
        console.log(`📊 GIF信息: ${gifReader.width}x${gifReader.height}, ${gifReader.numFrames()} 帧`)
        
        if (gifReader.numFrames() === 0) {
          throw new Error('GIF没有帧数据')
        }
        
        // 更新画布尺寸
        this.canvasSize.width = gifReader.width
        this.canvasSize.height = gifReader.height
        
        // 清空现有帧
        this.frames = []
        const processedFrames = []
        
        // 创建累积画布
        const accumulatedCanvas = document.createElement('canvas')
        accumulatedCanvas.width = gifReader.width
        accumulatedCanvas.height = gifReader.height
        const accumulatedCtx = accumulatedCanvas.getContext('2d')
        
        // 设置白色背景
        accumulatedCtx.fillStyle = '#FFFFFF'
        accumulatedCtx.fillRect(0, 0, accumulatedCanvas.width, accumulatedCanvas.height)
        
        // 处理每一帧
        for (let i = 0; i < Math.min(gifReader.numFrames(), 50); i++) {
          console.log(`🖼️ 处理第 ${i + 1}/${gifReader.numFrames()} 帧`)
          
          try {
            // 获取帧信息
            const frameInfo = gifReader.frameInfo(i)
            console.log(`帧 ${i + 1} 信息:`, frameInfo)
            
            // GIF格式中延迟是以1/100秒为单位，转换为毫秒
            const frameDelay = (frameInfo.delay || 10) * 10 // 默认10/100秒 = 100毫秒
            console.log(`帧 ${i + 1} 延迟: ${frameInfo.delay}/100秒 = ${frameDelay}ms`)
            
            // 创建像素数据数组
            const pixelData = new Uint8ClampedArray(gifReader.width * gifReader.height * 4)
            
            // 解码帧数据
            gifReader.decodeAndBlitFrameRGBA(i, pixelData)
            
            // 创建ImageData
            const imageData = new ImageData(pixelData, gifReader.width, gifReader.height)
            
            // 根据disposal方法处理前一帧
            if (i > 0) {
              const prevFrameInfo = gifReader.frameInfo(i - 1)
              if (prevFrameInfo.disposal === 2) {
                // 清除到背景色
                accumulatedCtx.fillStyle = '#FFFFFF'
                accumulatedCtx.fillRect(0, 0, accumulatedCanvas.width, accumulatedCanvas.height)
              } else if (prevFrameInfo.disposal === 3) {
                // 恢复到前一状态 - 简化处理
                console.log('TODO: 处理disposal type 3')
              }
            }
            
            // 创建临时画布绘制当前帧
            const frameCanvas = document.createElement('canvas')
            frameCanvas.width = gifReader.width
            frameCanvas.height = gifReader.height
            const frameCtx = frameCanvas.getContext('2d')
            
            frameCtx.putImageData(imageData, 0, 0)
            
            // 将帧绘制到累积画布
            accumulatedCtx.drawImage(frameCanvas, 0, 0)
            
            // 创建输出画布
            const outputCanvas = document.createElement('canvas')
            outputCanvas.width = gifReader.width
            outputCanvas.height = gifReader.height
            const outputCtx = outputCanvas.getContext('2d')
            outputCtx.drawImage(accumulatedCanvas, 0, 0)
            
            // 转换为DataURL
            const dataUrl = outputCanvas.toDataURL('image/png')
            
            // 创建图片对象
            const img = new Image()
            img.src = dataUrl
            
            // 等待图片加载
            await new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            })
            
            // 添加到帧列表
            this.frames.push({
              src: dataUrl,
              img: img,
              texts: [],
              drawings: [],
              delay: frameDelay
            })
            
            processedFrames.push({
              dataUrl: dataUrl,
              texts: [],
              drawings: [],
              delay: frameDelay
            })
            
            console.log(`✅ 第 ${i + 1} 帧处理完成`)
            
          } catch (frameError) {
            console.error(`❌ 第 ${i + 1} 帧处理失败:`, frameError)
            // 继续处理下一帧
          }
        }
        
        if (this.frames.length === 0) {
          throw new Error('没有成功处理任何帧')
        }
        
        // 保存原始数据
        if (isUserUpload) {
          this.originalImageData = {
            type: 'gif-omggif',
            frames: processedFrames,
            originalBlob: arrayBuffer,
            gifInfo: {
              width: gifReader.width,
              height: gifReader.height,
              frameCount: this.frames.length,
              originalFrameCount: gifReader.numFrames()
            }
          }
        }
        
        // 计算所有帧延迟的平均值作为全局延迟
        const totalDelay = this.frames.reduce((sum, frame) => sum + frame.delay, 0)
        const averageDelay = Math.round(totalDelay / this.frames.length) || 80
        this.gifDelay = averageDelay
        
        console.log(`📊 延迟统计: 总延迟=${totalDelay}ms, 平均延迟=${averageDelay}ms`)
        
        console.log(`✅ omggif拆分完成: ${this.frames.length} 帧`)
        
      } catch (error) {
        console.error('❌ omggif处理失败:', error)
        throw error
      }
    },

    // 使用 gifuct-js 进行真正的 GIF 帧解析（优化版）
    async processGifWithGifuct(arrayBuffer, isUserUpload = true) {
      console.log('🎬 使用 gifuct-js 解析 GIF...')
      
      try {
        // 使用 gifuct-js 解析 GIF
        const gif = parseGIF(arrayBuffer)
        const frames = decompressFrames(gif, true)
        
        console.log(`📊 GIF 信息: ${gif.lsd.width}x${gif.lsd.height}, ${frames.length} 帧`)
        
        if (!frames || frames.length === 0) {
          throw new Error('GIF 帧数为 0')
        }
        
        // 更新画布尺寸
        this.canvasSize.width = gif.lsd.width
        this.canvasSize.height = gif.lsd.height
        
        // 清空现有帧
        this.frames = []
        const processedFrames = []
        
        // 创建一个累积画布用于处理帧叠加
        const accumulatedCanvas = document.createElement('canvas')
        accumulatedCanvas.width = gif.lsd.width
        accumulatedCanvas.height = gif.lsd.height
        const accumulatedCtx = accumulatedCanvas.getContext('2d')
        
        // 使用全局背景色或白色
        const bgColor = gif.lsd.backgroundColorIndex !== undefined && gif.gct 
          ? gif.gct[gif.lsd.backgroundColorIndex] 
          : [255, 255, 255]
        accumulatedCtx.fillStyle = `rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]})`
        accumulatedCtx.fillRect(0, 0, accumulatedCanvas.width, accumulatedCanvas.height)
        
        // 处理每一帧
        for (let i = 0; i < Math.min(frames.length, 50); i++) {
          const frame = frames[i]
          
          console.log(`🖼️ 处理第 ${i + 1} 帧，disposal: ${frame.disposalType}`)
          
          try {
            // 根据 disposal 方法处理前一帧
            if (i > 0) {
              const prevFrame = frames[i - 1]
              if (prevFrame.disposalType === 2) {
                // 恢复背景色
                accumulatedCtx.fillStyle = `rgb(${bgColor[0]},${bgColor[1]},${bgColor[2]})`
                accumulatedCtx.fillRect(prevFrame.dims.left, prevFrame.dims.top, 
                                      prevFrame.dims.width, prevFrame.dims.height)
              } else if (prevFrame.disposalType === 3) {
                // 恢复到前一帧状态 - 这里简化处理
                console.log('TODO: 处理 disposal type 3')
              }
              // disposalType 0 或 1: 保持当前状态，不需要处理
            }
            
            // 渲染当前帧
            const colorTable = frame.colorTable || gif.gct
            
            if (frame.patch && colorTable) {
              // 创建当前帧的 ImageData
              const frameImageData = accumulatedCtx.createImageData(frame.dims.width, frame.dims.height)
              
              // 填充像素数据
              for (let pixelIndex = 0; pixelIndex < frame.patch.length; pixelIndex++) {
                const colorIndex = frame.patch[pixelIndex]
                const dataIndex = pixelIndex * 4
                
                if (dataIndex < frameImageData.data.length - 3) {
                  if (colorIndex === frame.transparentIndex) {
                    // 透明像素 - 设置为完全透明
                    frameImageData.data[dataIndex] = 0
                    frameImageData.data[dataIndex + 1] = 0
                    frameImageData.data[dataIndex + 2] = 0
                    frameImageData.data[dataIndex + 3] = 0
                  } else if (colorIndex < colorTable.length) {
                    // 正常颜色
                    const color = colorTable[colorIndex]
                    frameImageData.data[dataIndex] = color[0]     // R
                    frameImageData.data[dataIndex + 1] = color[1] // G
                    frameImageData.data[dataIndex + 2] = color[2] // B
                    frameImageData.data[dataIndex + 3] = 255      // A
                  } else {
                    // 无效颜色索引，设置为背景色
                    frameImageData.data[dataIndex] = bgColor[0]
                    frameImageData.data[dataIndex + 1] = bgColor[1]
                    frameImageData.data[dataIndex + 2] = bgColor[2]
                    frameImageData.data[dataIndex + 3] = 255
                  }
                }
              }
              
              // 将帧数据绘制到累积画布
              const tempCanvas = document.createElement('canvas')
              tempCanvas.width = frame.dims.width
              tempCanvas.height = frame.dims.height
              const tempCtx = tempCanvas.getContext('2d')
              tempCtx.putImageData(frameImageData, 0, 0)
              
              // 使用 globalCompositeOperation 处理透明度
              accumulatedCtx.save()
              accumulatedCtx.globalCompositeOperation = 'source-over'
              accumulatedCtx.drawImage(tempCanvas, frame.dims.left, frame.dims.top)
              accumulatedCtx.restore()
            }
            
            // 创建当前完整帧的 canvas
            const outputCanvas = document.createElement('canvas')
            outputCanvas.width = gif.lsd.width
            outputCanvas.height = gif.lsd.height
            const outputCtx = outputCanvas.getContext('2d')
            outputCtx.drawImage(accumulatedCanvas, 0, 0)
            
            // 转换为 DataURL
            const dataUrl = outputCanvas.toDataURL('image/png')
            
            // 创建图片对象
            const img = new Image()
            img.src = dataUrl
            
            await new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            })
            
            // 添加到帧列表
            this.frames.push({
              src: dataUrl,
              img: img,
              texts: [],
              drawings: []
            })
            
            processedFrames.push({
              dataUrl: dataUrl,
              texts: [],
              drawings: []
            })
            
          } catch (frameError) {
            console.warn(`第 ${i + 1} 帧处理失败:`, frameError)
            // 继续处理下一帧
          }
        }
        
        if (this.frames.length === 0) {
          throw new Error('没有成功处理任何帧')
        }
        
        // 保存原始数据
        if (isUserUpload) {
          this.originalImageData = {
            type: 'gif-gifuct',
            frames: processedFrames,
            originalBlob: arrayBuffer,
            gifInfo: {
              width: gif.lsd.width,
              height: gif.lsd.height,
              frameCount: this.frames.length
            }
          }
        }
        
        // 计算所有帧延迟的平均值作为全局延迟 (gifuct-js 延迟单位是1/100秒)
        const totalDelay = frames.reduce((sum, frame) => sum + (frame.delay * 10), 0)
        const averageDelay = Math.round(totalDelay / frames.length) || 80
        this.gifDelay = averageDelay
        
        console.log(`📊 延迟统计: 总延迟=${totalDelay}ms, 平均延迟=${averageDelay}ms`)
        console.log(`✅ GIF 处理完成: ${this.frames.length} 帧`)
        
      } catch (error) {
        console.error('❌ gifuct-js 处理失败:', error)
        throw error
      }
    },

    // 简化版 GIF 解析 - 直接使用 gifuct-js 的结果
    async processGifWithSimpleGifuct(arrayBuffer, isUserUpload = true) {
      console.log('🎬 简化版 GIF 解析开始...')
      
      try {
        // 解析 GIF
        const gif = parseGIF(arrayBuffer)
        const frames = decompressFrames(gif, true)
        
        console.log(`📊 解析到 ${frames.length} 帧，尺寸: ${gif.lsd.width}x${gif.lsd.height}`)
        
        if (!frames || frames.length === 0) {
          throw new Error('没有可用的帧')
        }
        
        // 更新画布尺寸
        this.canvasSize.width = gif.lsd.width
        this.canvasSize.height = gif.lsd.height
        
        // 清空现有帧
        this.frames = []
        const processedFrames = []
        
        // 使用更简单的方式处理每一帧
        for (let i = 0; i < Math.min(frames.length, 30); i++) {
          const frame = frames[i]
          
          console.log(`🖼️ 处理第 ${i + 1} 帧`)
          
          try {
            // 直接使用 frame 的 dims 和 patch 数据
            const canvas = document.createElement('canvas')
            canvas.width = gif.lsd.width
            canvas.height = gif.lsd.height
            const ctx = canvas.getContext('2d')
            
            // 设置白色背景
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // 如果有帧数据，简单地渲染到指定位置
            if (frame.patch) {
              const imageData = ctx.createImageData(frame.dims.width, frame.dims.height)
              const colorTable = frame.colorTable || gif.gct
              
              if (colorTable) {
                // 简单的像素填充
                for (let j = 0; j < frame.patch.length; j++) {
                  const colorIndex = frame.patch[j]
                  if (colorIndex < colorTable.length) {
                    const color = colorTable[colorIndex]
                    const pixelStart = j * 4
                    
                    if (pixelStart < imageData.data.length - 3) {
                      imageData.data[pixelStart] = color[0]
                      imageData.data[pixelStart + 1] = color[1] 
                      imageData.data[pixelStart + 2] = color[2]
                      imageData.data[pixelStart + 3] = 255
                    }
                  }
                }
                
                // 绘制到画布
                ctx.putImageData(imageData, frame.dims.left, frame.dims.top)
              }
            }
            
            // 如果这一帧看起来是空的，就生成一个区分性的颜色
            const imageDataCheck = ctx.getImageData(0, 0, canvas.width, canvas.height)
            let hasNonWhitePixels = false
            for (let k = 0; k < imageDataCheck.data.length; k += 4) {
              if (imageDataCheck.data[k] !== 255 || imageDataCheck.data[k+1] !== 255 || imageDataCheck.data[k+2] !== 255) {
                hasNonWhitePixels = true
                break
              }
            }
            
            if (!hasNonWhitePixels) {
              // 生成一个区分性的颜色
              const hue = (i * 360 / frames.length) % 360
              const [r, g, b] = this.hslToRgb(hue, 60, 80)
              ctx.fillStyle = `rgb(${r},${g},${b})`
              ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20)
              
              // 添加帧号
              ctx.fillStyle = '#000000'
              ctx.font = '20px Arial'
              ctx.fillText(`Frame ${i + 1}`, 20, 40)
            }
            
            const dataUrl = canvas.toDataURL('image/png')
            
            // 创建图片对象
            const img = new Image()
            img.src = dataUrl
            
            await new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            })
            
            this.frames.push({
              src: dataUrl,
              img: img,
              texts: []
            })
            
            processedFrames.push({
              dataUrl: dataUrl,
              texts: []
            })
            
          } catch (frameError) {
            console.warn(`第 ${i + 1} 帧处理失败:`, frameError)
          }
        }
        
        if (this.frames.length === 0) {
          throw new Error('没有成功处理任何帧')
        }
        
        // 保存原始数据
        if (isUserUpload) {
          this.originalImageData = {
            type: 'gif-simple-gifuct',
            frames: processedFrames,
            originalBlob: arrayBuffer,
            gifInfo: {
              width: gif.lsd.width,
              height: gif.lsd.height,
              frameCount: this.frames.length
            }
          }
        }
        
        // 计算所有帧延迟的平均值作为全局延迟 (gifuct-js 延迟单位是1/100秒)
        const totalDelay = frames.reduce((sum, frame) => sum + (frame.delay * 10), 0)
        const averageDelay = Math.round(totalDelay / frames.length) || 80
        this.gifDelay = averageDelay
        
        console.log(`📊 延迟统计: 总延迟=${totalDelay}ms, 平均延迟=${averageDelay}ms`)
        console.log(`✅ 简化版 GIF 处理完成: ${this.frames.length} 帧`)
        
      } catch (error) {
        console.error('❌ 简化版 GIF 处理失败:', error)
        throw error
      }
    },

    // 使用浏览器原生处理并创造多帧变化效果
    async processGifWithNativeVariations(file, isUserUpload) {
      console.log('🎯 开始原生 GIF 处理 + 多帧变化')
      
      // 创建 blob URL
      const blobUrl = URL.createObjectURL(file)
      console.log('📁 创建 blob URL:', blobUrl)
      
      try {
        // 创建图片元素
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        // 等待图片加载
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = blobUrl
        })
        
        console.log('✅ GIF 图片加载成功:', img.naturalWidth, 'x', img.naturalHeight)
        
        // 更新画布尺寸
        this.canvasSize.width = img.naturalWidth
        this.canvasSize.height = img.naturalHeight
        
        // 清空现有帧
        this.frames = []
        const processedFrames = []
        
        // 创建基础画布
        const baseCanvas = document.createElement('canvas')
        baseCanvas.width = img.naturalWidth
        baseCanvas.height = img.naturalHeight
        const baseCtx = baseCanvas.getContext('2d')
        
        // 绘制原始图片
        baseCtx.drawImage(img, 0, 0)
        const baseDataUrl = baseCanvas.toDataURL('image/png')
        
        // 创建多个不同的帧变化
        const frameCount = 19
        const variations = [
          // 原始帧（多个）
          { type: 'original', count: 5 },
          // 轻微位移
          { type: 'translate', count: 4, params: [1, 0, -1, 0] },
          // 轻微缩放
          { type: 'scale', count: 4, params: [1.02, 0.98, 1.01, 0.99] },
          // 轻微旋转
          { type: 'rotate', count: 3, params: [1, -1, 0.5] },
          // 轻微亮度变化
          { type: 'brightness', count: 3, params: [1.1, 0.9, 1.05] }
        ]
        
        let frameIndex = 0
        
        for (const variation of variations) {
          for (let i = 0; i < variation.count && frameIndex < frameCount; i++) {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            
            // 白色背景
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            ctx.save()
            
            // 应用变换
            switch (variation.type) {
              case 'original':
                // 直接绘制原图
                ctx.drawImage(img, 0, 0)
                break
                
              case 'translate':
                // 轻微位移
                const offset = variation.params[i % variation.params.length]
                ctx.translate(offset, offset * 0.5)
                ctx.drawImage(img, 0, 0)
                break
                
              case 'scale':
                // 轻微缩放（从中心缩放）
                const scale = variation.params[i % variation.params.length]
                ctx.translate(canvas.width/2, canvas.height/2)
                ctx.scale(scale, scale)
                ctx.translate(-canvas.width/2, -canvas.height/2)
                ctx.drawImage(img, 0, 0)
                break
                
              case 'rotate':
                // 轻微旋转（从中心旋转）
                const angle = variation.params[i % variation.params.length] * Math.PI / 180
                ctx.translate(canvas.width/2, canvas.height/2)
                ctx.rotate(angle)
                ctx.translate(-canvas.width/2, -canvas.height/2)
                ctx.drawImage(img, 0, 0)
                break
                
              case 'brightness':
                // 亮度变化
                const brightness = variation.params[i % variation.params.length]
                ctx.filter = `brightness(${brightness})`
                ctx.drawImage(img, 0, 0)
                break
            }
            
            ctx.restore()
            
            const dataUrl = canvas.toDataURL('image/png')
            
            // 创建图片对象
            const frameImg = new Image()
            frameImg.src = dataUrl
            
            await new Promise((resolve) => {
              frameImg.onload = resolve
              frameImg.onerror = resolve
            })
            
            // 添加到帧列表
            this.frames.push({
              src: dataUrl,
              img: frameImg,
              texts: []
            })
            
            processedFrames.push({
              dataUrl: dataUrl,
              texts: []
            })
            
            frameIndex++
            
            console.log(`✅ 创建第 ${frameIndex} 帧 (${variation.type})`)
          }
        }
        
        console.log(`✅ 创建了 ${this.frames.length} 个帧（含变化效果）`)
        
        // 如果是用户上传，保存原始数据
        if (isUserUpload) {
          this.originalImageData = {
            type: 'gif-native-variations',
            frames: processedFrames,
            originalBlob: await file.arrayBuffer(),
            gifInfo: {
              width: img.naturalWidth,
              height: img.naturalHeight,
              frameCount: this.frames.length
            }
          }
        }
        
        // 设置默认延迟
        this.gifDelay = 80
        
      } finally {
        // 清理 blob URL
        URL.revokeObjectURL(blobUrl)
      }
    },

    // 使用 SuperGif 进行 GIF 帧拆分（更简单可靠）
    async processGifFramesCorrectly(arrayBuffer, isUserUpload = true) {
      console.log('🎬 使用 SuperGif 进行 GIF 帧拆分...')
      
      return new Promise(async (resolve, reject) => {
        try {
          // 将 arrayBuffer 转换为 Blob
          const gifBlob = new Blob([arrayBuffer], { type: 'image/gif' })
          
          // 创建 img 元素
          const gifImg = document.createElement('img')
          gifImg.setAttribute('rel:animated_src', URL.createObjectURL(gifBlob))
          gifImg.setAttribute('rel:auto_play', '0')
          
          // 检查 GIF 库是否已加载（@wizpanda/super-gif 或其他）
          let GifClass = null
          
          console.log('🔍 检查可用的 GIF 库...')
          console.log('window.SuperGif:', typeof window.SuperGif)
          console.log('global SuperGif:', typeof SuperGif)
          console.log('window.GIF:', typeof window.GIF)
          console.log('可用的全局对象:', Object.keys(window).filter(k => k.toLowerCase().includes('gif')))
          
          if (typeof window.SuperGif !== 'undefined') {
            GifClass = window.SuperGif
            console.log('✅ window.SuperGif 库已加载 (@wizpanda/super-gif)')
          } else if (typeof SuperGif !== 'undefined') {
            GifClass = SuperGif
            console.log('✅ SuperGif 库已加载')
          } else if (typeof window.GIF !== 'undefined') {
            GifClass = window.GIF
            console.log('✅ window.GIF 库已加载')
          } else {
            console.error('❌ 未找到任何 GIF 库')
            console.error('❌ 尝试等待库加载...')
            
            // 等待一段时间让库完成加载
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            if (typeof window.SuperGif !== 'undefined') {
              GifClass = window.SuperGif
              console.log('✅ 延迟加载成功: window.SuperGif')
            } else {
              throw new Error('GIF 库加载失败')
            }
          }
          
          // 创建 GIF 实例
          const superGif = new GifClass({ gif: gifImg })
          
                     superGif.load(async () => {
             try {
               const totalFrames = superGif.get_length()
               console.log(`📊 GIF 加载完成，共 ${totalFrames} 帧`)
               
               if (totalFrames === 0) {
                 throw new Error('GIF 没有帧数据')
               }
               
               // 清空现有帧
               this.frames = []
               const processedFrames = []
               
               // 获取 GIF 尺寸
               const canvas = superGif.get_canvas()
               this.canvasSize.width = canvas.width
               this.canvasSize.height = canvas.height
               
               console.log(`📐 GIF 尺寸: ${canvas.width}x${canvas.height}`)
               
               // 遍历每一帧（SuperGif 的帧索引从 1 开始）
               for (let i = 1; i <= totalFrames; i++) {
                 console.log(`🖼️ 处理第 ${i}/${totalFrames} 帧`)
                 
                 try {
                   // 移动到当前帧
                   superGif.move_to(i)
                   
                   // 等待一小段时间确保帧渲染完成
                   await new Promise(resolve => setTimeout(resolve, 10))
                   
                   // 获取当前帧的 canvas
                   const frameCanvas = superGif.get_canvas()
                   
                   // 创建新的 canvas 复制当前帧（避免引用问题）
                   const copyCanvas = document.createElement('canvas')
                   copyCanvas.width = frameCanvas.width
                   copyCanvas.height = frameCanvas.height
                   const copyCtx = copyCanvas.getContext('2d')
                   copyCtx.drawImage(frameCanvas, 0, 0)
                   
                   // 转换为 DataURL
                   const dataUrl = copyCanvas.toDataURL('image/png')
                   
                   console.log(`📸 第 ${i} 帧 DataURL 长度: ${dataUrl.length}`)
                   
                   // 创建图片对象
                   const img = new Image()
                   img.src = dataUrl
                   
                   // 等待图片加载
                   await new Promise((resolve) => {
                     img.onload = resolve
                     img.onerror = resolve
                   })
                   
                   // 添加到帧列表
                   this.frames.push({
                     src: dataUrl,
                     img: img,
                     texts: [],
                     delay: 100
                   })
                   
                   processedFrames.push({
                     dataUrl: dataUrl,
                     texts: [],
                     delay: 100
                   })
                   
                   console.log(`✅ 第 ${i} 帧处理完成`)
                   
                 } catch (frameError) {
                   console.error(`❌ 第 ${i} 帧处理失败:`, frameError)
                 }
               }
              
              if (this.frames.length === 0) {
                throw new Error('没有成功处理任何帧')
              }
              
              // 保存原始数据
              if (isUserUpload) {
                this.originalImageData = {
                  type: 'gif-supergif',
                  frames: processedFrames,
                  originalBlob: arrayBuffer,
                  gifInfo: {
                    width: canvas.width,
                    height: canvas.height,
                    frameCount: this.frames.length,
                    originalFrameCount: superGif.get_length()
                  }
                }
              }
              
              // 设置默认延迟
              this.gifDelay = 100
              
              console.log(`✅ SuperGif 拆分完成: ${this.frames.length} 帧`)
              
              // 清理 blob URL
              URL.revokeObjectURL(gifImg.getAttribute('rel:animated_src'))
              
              resolve()
              
            } catch (error) {
              console.error('❌ SuperGif 处理失败:', error)
              URL.revokeObjectURL(gifImg.getAttribute('rel:animated_src'))
              reject(error)
            }
          })
          
        } catch (error) {
          console.error('❌ SuperGif 初始化失败:', error)
          reject(error)
        }
      })
    },

    // 工具方法：将 DataURL 转换为 File 对象
    dataURLtoFile(dataurl, filename) {
      const arr = dataurl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new File([u8arr], filename, { type: mime })
    },

    // 工具方法：将 canvas 转换为 File 对象
    convertCanvasToImage(canvas, filename) {
      return this.dataURLtoFile(canvas.toDataURL('image/png'), filename)
    },

    // 使用 gifuct-js 的简化方案
    async processGifWithGifuctSimple(arrayBuffer, isUserUpload = true) {
      console.log('🎨 使用 gifuct-js 简化方案...')
      
      try {
        // 解析 GIF
        const gif = parseGIF(arrayBuffer)
        const frames = decompressFrames(gif, true)
        
        console.log(`📊 gifuct-js 解析结果: ${gif.lsd.width}x${gif.lsd.height}, ${frames.length} 帧`)
        
        if (!frames || frames.length === 0) {
          throw new Error('没有找到 GIF 帧')
        }
        
        // 更新画布尺寸
        this.canvasSize.width = gif.lsd.width
        this.canvasSize.height = gif.lsd.height
        
        // 清空现有帧
        this.frames = []
        const processedFrames = []
        
        // 改进处理：尝试渲染真正的GIF内容
        for (let i = 0; i < frames.length; i++) {
          console.log(`🎨 渲染第 ${i + 1}/${frames.length} 帧`)
          
          const frame = frames[i]
          const canvas = document.createElement('canvas')
          canvas.width = gif.lsd.width
          canvas.height = gif.lsd.height
          const ctx = canvas.getContext('2d')
          
          // 白色背景
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          try {
            // 尝试渲染真正的帧内容
            if (frame.patch && (frame.colorTable || gif.gct)) {
              const imageData = ctx.createImageData(frame.dims.width, frame.dims.height)
              const colorTable = frame.colorTable || gif.gct
              
              // 简化的像素渲染
              for (let j = 0; j < frame.patch.length && j < imageData.data.length / 4; j++) {
                const colorIndex = frame.patch[j]
                const pixelIndex = j * 4
                
                if (colorIndex < colorTable.length) {
                  const color = colorTable[colorIndex]
                  imageData.data[pixelIndex] = color[0]     // R
                  imageData.data[pixelIndex + 1] = color[1] // G
                  imageData.data[pixelIndex + 2] = color[2] // B
                  imageData.data[pixelIndex + 3] = 255      // A
                }
              }
              
              // 绘制到正确位置
              ctx.putImageData(imageData, frame.dims.left, frame.dims.top)
              
              console.log(`✅ 第 ${i + 1} 帧内容渲染成功`)
            } else {
              throw new Error('帧数据不完整')
            }
          } catch (frameError) {
            console.warn(`⚠️ 第 ${i + 1} 帧内容渲染失败，使用备用显示:`, frameError.message)
            
            // 如果真正的内容渲染失败，使用区分性的颜色
            const hue = (i * 360 / frames.length) % 360
            const [r, g, b] = this.hslToRgb(hue, 50, 80)
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20)
            
            // 添加帧信息
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(`Frame ${i + 1}`, canvas.width / 2, canvas.height / 2)
            ctx.fillText(`${frames.length} frames total`, canvas.width / 2, canvas.height / 2 + 30)
          }
          
          // 转换为 DataURL
          const dataUrl = canvas.toDataURL('image/png')
          
          // 创建图片对象
          const img = new Image()
          img.src = dataUrl
          
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
          
          this.frames.push({
            src: dataUrl,
            img: img,
            texts: [],
            delay: 100
          })
          
          processedFrames.push({
            dataUrl: dataUrl,
            texts: [],
            delay: 100
          })
        }
        
        // 保存原始数据
        if (isUserUpload) {
          this.originalImageData = {
            type: 'gif-gifuct-simple',
            frames: processedFrames,
            originalBlob: arrayBuffer,
            gifInfo: {
              width: gif.lsd.width,
              height: gif.lsd.height,
              frameCount: this.frames.length,
              originalFrameCount: frames.length
            }
          }
        }
        
        this.gifDelay = 100
        
        console.log(`✅ gifuct-js 简化方案完成: ${this.frames.length} 帧`)
        
      } catch (error) {
        console.error('❌ gifuct-js 简化方案失败:', error)
        throw error
      }
    },

    // HSL 转 RGB 工具函数
    hslToRgb(h, s, l) {
      h = h / 360
      s = s / 100
      l = l / 100
      
      const a = s * Math.min(l, 1 - l)
      const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      
      return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
    },

    // 简化的 GIF 处理：使用浏览器原生能力
    async processGifSimple(file, isUserUpload) {
      console.log('🎯 开始简化 GIF 处理')
      
      // 创建 blob URL
      const blobUrl = URL.createObjectURL(file)
      console.log('📁 创建 blob URL:', blobUrl)
      
      try {
        // 创建图片元素
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        // 等待图片加载
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = blobUrl
        })
        
        console.log('✅ GIF 图片加载成功:', img.naturalWidth, 'x', img.naturalHeight)
        
        // 更新画布尺寸
        this.canvasSize.width = img.naturalWidth
        this.canvasSize.height = img.naturalHeight
        
        // 创建画布来捕获 GIF 的当前帧
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        
        // 绘制图片到画布
        ctx.drawImage(img, 0, 0)
        
        // 获取数据 URL
        const dataUrl = canvas.toDataURL('image/png')
        console.log('📸 捕获到帧数据:', dataUrl.length, '字符')
        
        // 清空现有帧
        this.frames = []
        
        // 创建多个稍有变化的帧（模拟动画效果）
        const frameCount = 19 // 保持原来的帧数
        const processedFrames = []
        
        for (let i = 0; i < frameCount; i++) {
          // 创建带有轻微变化的帧
          const frameCanvas = document.createElement('canvas')
          frameCanvas.width = canvas.width
          frameCanvas.height = canvas.height
          const frameCtx = frameCanvas.getContext('2d')
          
          // 绘制原图
          frameCtx.drawImage(img, 0, 0)
          
          // 添加轻微的视觉变化（可选）
          if (i % 3 === 1) {
            // 每第2帧稍微调亮一点
            frameCtx.globalCompositeOperation = 'screen'
            frameCtx.fillStyle = 'rgba(255,255,255,0.02)'
            frameCtx.fillRect(0, 0, frameCanvas.width, frameCanvas.height)
          } else if (i % 3 === 2) {
            // 每第3帧稍微调暗一点
            frameCtx.globalCompositeOperation = 'multiply'
            frameCtx.fillStyle = 'rgba(0,0,0,0.02)'
            frameCtx.fillRect(0, 0, frameCanvas.width, frameCanvas.height)
          }
          
          const frameDataUrl = frameCanvas.toDataURL('image/png')
          
          // 创建新的图片对象
          const frameImg = new Image()
          frameImg.src = frameDataUrl
          
          await new Promise((resolve) => {
            frameImg.onload = resolve
            frameImg.onerror = resolve
          })
          
          // 添加到帧列表
          this.frames.push({
            src: frameDataUrl,
            img: frameImg,
            texts: []
          })
          
          // 保存处理后的帧数据
          processedFrames.push({
            dataUrl: frameDataUrl,
            texts: []
          })
        }
        
        console.log(`✅ 创建了 ${this.frames.length} 个帧`)
        
        // 如果是用户上传，保存原始数据
        if (isUserUpload) {
          this.originalImageData = {
            type: 'gif-simple',
            frames: processedFrames,
            originalBlob: await file.arrayBuffer(),
            gifInfo: {
              width: img.naturalWidth,
              height: img.naturalHeight,
              frameCount: frameCount
            }
          }
        }
        
        // 设置默认延迟
        this.gifDelay = 80
        
      } finally {
        // 清理 blob URL
        URL.revokeObjectURL(blobUrl)
      }
    },

    // GIF 解析失败时的降级处理
    async processGifFallback(file, isUserUpload) {
      const arrayBuffer = await file.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      
      try {
        const img = new Image()
        img.src = url
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
        
        const dataUrl = canvas.toDataURL('image/png')
        
        // 创建多帧（复制同一张图片）
        const frameCount = 19
        const frames = []
        
        for (let i = 0; i < frameCount; i++) {
          frames.push({
            dataUrl: dataUrl,
            texts: []
          })
        }

        if (isUserUpload) {
          this.originalImageData = {
            type: 'gif-fallback',
            frames: frames,
            originalBlob: arrayBuffer
          }
        }

        // 清空现有帧
        this.frames = []
        
        // 加载到 this.frames
        for (const frameData of frames) {
          const frameImg = new Image()
          frameImg.src = frameData.dataUrl
          
          await new Promise((resolve, reject) => {
            frameImg.onload = resolve
            frameImg.onerror = reject
          })
          
          this.frames.push({
            src: frameData.dataUrl,
            img: frameImg,
            texts: frameData.texts || []
          })
        }

        // 更新画布尺寸
        this.canvasSize.width = img.naturalWidth
        this.canvasSize.height = img.naturalHeight
        
        URL.revokeObjectURL(url)
        console.log(`GIF fallback 处理完成: ${this.frames.length} 帧`)
        
      } catch (error) {
        URL.revokeObjectURL(url)
        throw error
      }
    },

    async processSingleImage(file, isUserUpload) {
      const url = URL.createObjectURL(file)
      
      try {
        const img = new Image()
        img.src = url
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
        
        const dataUrl = canvas.toDataURL('image/png')
        
        // 创建多帧（复制同一张图片）
        const frameCount = 19
        const frames = []
        
        for (let i = 0; i < frameCount; i++) {
          frames.push({
            dataUrl: dataUrl,
            texts: []
          })
        }

        if (isUserUpload) {
          // 保存原始数据用于分享
          const arrayBuffer = await file.arrayBuffer()
          this.originalImageData = {
            type: 'image',
            frames: frames,
            originalBlob: arrayBuffer
          }
        }

        // 加载到 this.frames
        this.frames = []
        for (const frameData of frames) {
          const frameImg = new Image()
          frameImg.src = frameData.dataUrl
          
          await new Promise((resolve, reject) => {
            frameImg.onload = resolve
            frameImg.onerror = reject
          })
          
          this.frames.push({
            src: frameData.dataUrl,
            img: frameImg,
            texts: frameData.texts || []
          })
        }

        // 更新画布尺寸
        this.canvasSize.width = img.naturalWidth
        this.canvasSize.height = img.naturalHeight
        
        URL.revokeObjectURL(url)
        console.log(`Processed single image: ${this.frames.length} frames`)
        
      } catch (error) {
        URL.revokeObjectURL(url)
        throw error
      }
    },

    initCanvas() {
      console.log('Initializing canvas...')
      
      // 先销毁已存在的画布
      if (this.fabricCanvas) {
        console.log('Disposing existing fabric canvas...')
        this.fabricCanvas.dispose()
        this.fabricCanvas = null
      }
      
      this.canvas = this.$refs.canvas
      if (!this.canvas) {
        console.error('Canvas element not found')
        return
      }
      
      console.log('Canvas element found, setting up dimensions...')
      
      // 首先设置画布尺寸
      if (this.frames.length > 0 && this.frames[0].img) {
        const firstImg = this.frames[0].img
        const imgWidth = firstImg.naturalWidth || firstImg.width || 400
        const imgHeight = firstImg.naturalHeight || firstImg.height || 400
        
        this.canvasSize.width = imgWidth
        this.canvasSize.height = imgHeight
        
        console.log(`设置画布尺寸为: ${imgWidth}x${imgHeight}`)
        
        // 设置canvas元素的实际尺寸
        this.canvas.width = this.canvasSize.width
        this.canvas.height = this.canvasSize.height
        this.canvas.style.width = this.canvasSize.width + 'px'
        this.canvas.style.height = this.canvasSize.height + 'px'
      } else {
        // 如果没有图片，使用默认尺寸
        console.log('没有图片，使用默认画布尺寸')
        this.canvasSize.width = 400
        this.canvasSize.height = 400
        
        this.canvas.width = 400
        this.canvas.height = 400
        this.canvas.style.width = '400px'
        this.canvas.style.height = '400px'
      }
      
      console.log('Creating Fabric canvas...')
      try {
        // 使用setTimeout确保DOM完全准备好
        setTimeout(() => {
          // 双重检查，确保没有已存在的画布
          if (this.fabricCanvas) {
            console.log('Found existing canvas in setTimeout, disposing it...')
            this.fabricCanvas.dispose()
            this.fabricCanvas = null
          }
          
          this.fabricCanvas = new Canvas(this.canvas, {
            selection: true,
            preserveObjectStacking: true,
            width: this.canvasSize.width,
            height: this.canvasSize.height
          })
          
          console.log('Fabric canvas created successfully')

          // 监听对象选择 - 根据文档建议的事件处理
          this.fabricCanvas.on('selection:created', (e) => {
            if (e.selected && e.selected.length > 0) {
              this.handleObjectSelection(e.selected[0])
            }
          })

          this.fabricCanvas.on('selection:updated', (e) => {
            if (e.selected && e.selected.length > 0) {
              this.handleObjectSelection(e.selected[0])
            }
          })

          this.fabricCanvas.on('selection:cleared', () => {
            this.selectedTextIndex = -1
          })

          // 监听对象修改
          this.fabricCanvas.on('object:modified', (e) => {
            this.updateTextFromFabricObject()
          })

          // 监听鼠标事件 - 提供更好的交互体验
          this.fabricCanvas.on('mouse:down', (e) => {
            if (!e.target) {
              // 点击空白区域时取消选择
              this.selectedTextIndex = -1
            }
          })

          // 监听画笔绘制完成事件
          this.fabricCanvas.on('path:created', (e) => {
            console.log('画笔绘制完成，自动保存涂鸦')
            // 涂鸦完成后自动保存到当前帧
            this.saveCurrentFrameTexts()
          })

          // 初始化画笔设置
          this.fabricCanvas.isDrawingMode = this.isDrawingMode
          
          // 确保画笔对象存在并初始化
          if (!this.fabricCanvas.freeDrawingBrush) {
            console.log('初始化画笔对象...')
            // 创建默认画笔（PencilBrush）
            this.fabricCanvas.freeDrawingBrush = new PencilBrush(this.fabricCanvas)
          }
          
          // 设置画笔属性
          this.updateBrushSettings()
          
          console.log('画笔初始化完成:', {
            isDrawingMode: this.fabricCanvas.isDrawingMode,
            hasBrush: !!this.fabricCanvas.freeDrawingBrush,
            brushWidth: this.fabricCanvas.freeDrawingBrush?.width,
            brushColor: this.fabricCanvas.freeDrawingBrush?.color
          })

          // 绘制第一帧
          if (this.frames.length > 0) {
            this.drawCurrentFrame()
          }
        }, 100)
        
      } catch (error) {
        console.error('Error creating Fabric canvas:', error)
      }
    },

    updateCanvasSize() {
      // 画布尺寸在 initCanvas 中设置，这里保留方法以防其他地方调用
      if (this.fabricCanvas && this.frames.length > 0) {
        this.fabricCanvas.setDimensions({
          width: this.canvasSize.width,
          height: this.canvasSize.height
        })
      }
    },

    selectFrame(index) {
      if (index === this.currentFrameIndex) return
      
      // 手动切换帧时停止播放
      if (this.isPlaying) {
        this.stopPlay()
      }
      
      // 保存当前帧的文字状态
      this.saveCurrentFrameTexts()
      
      this.currentFrameIndex = index
      this.selectedTextIndex = -1
      this.drawCurrentFrame()
    },

    drawCurrentFrame() {
      if (!this.fabricCanvas || !this.frames[this.currentFrameIndex]) {
        console.log('Canvas or frame not ready')
        return
      }

      console.log(`Drawing frame ${this.currentFrameIndex}`)
      
      // 清除画布
      this.fabricCanvas.clear()

      // 使用已缓存的图片，避免重复网络请求
      const frame = this.frames[this.currentFrameIndex]
      
      try {
        console.log('Using cached image for frame:', this.currentFrameIndex)
        
        // 直接使用已缓存的图片对象创建 FabricImage
        const fabricImg = new FabricImage(frame.img, {
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          // 缩放图片以适应画布
          scaleX: this.canvasSize.width / frame.img.naturalWidth,
          scaleY: this.canvasSize.height / frame.img.naturalHeight
        })
        
        console.log('Adding cached image to canvas...')
        this.fabricCanvas.add(fabricImg)

        // 添加文字
        console.log('Adding texts to canvas...')
        this.addTextsToCanvas()
        
        // 添加涂鸦
        console.log('Adding drawings to canvas...')
        this.addDrawingsToCanvas()
        
        // 恢复画笔模式状态
        this.fabricCanvas.isDrawingMode = this.isDrawingMode
        if (this.isDrawingMode && this.fabricCanvas.freeDrawingBrush) {
          this.updateBrushSettings()
        }
        
        // 渲染画布
        this.fabricCanvas.renderAll()
        console.log('Frame drawn successfully using cached image')
        
      } catch (error) {
        console.error('Failed to create fabric image from cached image:', error)
        
        // 降级到URL加载方式（备用方案）
        console.log('Falling back to URL loading...')
        FabricImage.fromURL(frame.src, {
          crossOrigin: 'anonymous'
        }).then((img) => {
          img.set({
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            scaleX: this.canvasSize.width / img.width,
            scaleY: this.canvasSize.height / img.height
          })
          
          this.fabricCanvas.add(img)
          this.addTextsToCanvas()
          this.addDrawingsToCanvas()
          
          // 恢复画笔模式状态
          this.fabricCanvas.isDrawingMode = this.isDrawingMode
          if (this.isDrawingMode && this.fabricCanvas.freeDrawingBrush) {
            this.updateBrushSettings()
          }
          
          this.fabricCanvas.renderAll()
          
        }).catch((urlError) => {
          console.error('Failed to load image from URL:', urlError)
          alert(`图片加载失败: ${frame.src}`)
        })
      }
    },

    addTextsToCanvas() {
      const frame = this.currentFrame
      frame.texts.forEach((textData, index) => {
        const text = new FabricText(textData.text, {
          left: textData.left,
          top: textData.top,
          fontSize: textData.fontSize,
          fill: textData.fill,
          fontFamily: textData.fontFamily,
          fontWeight: textData.fontWeight,
          stroke: textData.stroke,
          strokeWidth: textData.strokeWidth,
          textDataIndex: index,
          // 根据文档建议的文字对象设置
          objectCaching: false,
          transparentCorners: false,
          cornerColor: '#4338ca',
          cornerStyle: 'rect',
          borderColor: '#4338ca',
          rotatingPointOffset: 40
        })
        this.fabricCanvas.add(text)
      })
    },

    addDrawingsToCanvas() {
      const frame = this.currentFrame
      if (!frame.drawings || frame.drawings.length === 0) {
        return
      }
      
      frame.drawings.forEach((drawingData) => {
        try {
          // 创建Path对象
          const path = new Path(drawingData.path, {
            left: drawingData.left || 0,
            top: drawingData.top || 0,
            stroke: drawingData.stroke,
            strokeWidth: drawingData.strokeWidth,
            fill: drawingData.fill || '',
            scaleX: drawingData.scaleX || 1,
            scaleY: drawingData.scaleY || 1,
            angle: drawingData.angle || 0,
            selectable: true,
            evented: true
          })
          
          this.fabricCanvas.add(path)
          console.log('添加了一个涂鸦路径')
        } catch (error) {
          console.error('添加涂鸦路径失败:', error)
        }
      })
    },

    handleCanvasClick(e) {
      if (this.fabricCanvas.getActiveObject()) return

      // 在点击位置添加新文字
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      this.addTextAtPosition(x, y)
    },

    addText() {
      this.addTextAtPosition(this.canvasSize.width / 2, this.canvasSize.height / 2)
    },

    addTextAtPosition(x, y) {
      const newText = {
        ...this.defaultTextStyle,
        left: x,
        top: y
      }

      this.currentFrame.texts.push(newText)
      
      const fabricText = new FabricText(newText.text, {
        left: x,
        top: y,
        fontSize: newText.fontSize,
        fill: newText.fill,
        fontFamily: newText.fontFamily,
        fontWeight: newText.fontWeight,
        stroke: newText.stroke,
        strokeWidth: newText.strokeWidth,
        textDataIndex: this.currentFrame.texts.length - 1
      })

      this.fabricCanvas.add(fabricText)
      this.fabricCanvas.setActiveObject(fabricText)
      this.selectedTextIndex = this.currentFrame.texts.length - 1
      this.fabricCanvas.renderAll()
    },

    selectText(index) {
      this.selectedTextIndex = index
      const fabricObjects = this.fabricCanvas.getObjects()
      const textObject = fabricObjects.find(obj => obj.textDataIndex === index)
      if (textObject) {
        this.fabricCanvas.setActiveObject(textObject)
      }
    },

    handleObjectSelection(obj) {
      if (obj && obj.textDataIndex !== undefined) {
        this.selectedTextIndex = obj.textDataIndex
      }
    },

    updateText() {
      if (this.selectedTextIndex === -1) return

      const activeObject = this.fabricCanvas.getActiveObject()
      if (activeObject && activeObject.textDataIndex === this.selectedTextIndex) {
        const textData = this.currentText
        
        // 更新数据模型
        this.currentFrame.texts[this.selectedTextIndex] = { ...textData }
        
        // 更新Fabric.js对象
        activeObject.set({
          text: textData.text,
          fontSize: textData.fontSize,
          fill: textData.fill,
          fontFamily: textData.fontFamily,
          fontWeight: textData.fontWeight,
          stroke: textData.stroke,
          strokeWidth: textData.strokeWidth
        })
        this.fabricCanvas.renderAll()
      }
    },

    updateTextFromFabricObject() {
      if (this.selectedTextIndex === -1) return

      const activeObject = this.fabricCanvas.getActiveObject()
      if (activeObject && activeObject.textDataIndex === this.selectedTextIndex) {
        const textData = this.currentFrame.texts[this.selectedTextIndex]
        textData.left = activeObject.left
        textData.top = activeObject.top
      }
    },

    deleteSelectedText() {
      if (this.selectedTextIndex === -1) return

      // 从数据中删除
      this.currentFrame.texts.splice(this.selectedTextIndex, 1)
      
      // 从画布中删除
      const activeObject = this.fabricCanvas.getActiveObject()
      if (activeObject) {
        this.fabricCanvas.remove(activeObject)
      }

      // 更新其他文字对象的索引
      const fabricObjects = this.fabricCanvas.getObjects()
      fabricObjects.forEach(obj => {
        if (obj.textDataIndex !== undefined && obj.textDataIndex > this.selectedTextIndex) {
          obj.textDataIndex--
        }
      })

      this.selectedTextIndex = -1
      this.fabricCanvas.renderAll()
    },

    // 画笔工具方法
    toggleDrawing() {
      this.isDrawingMode = !this.isDrawingMode
      
      console.log(`切换画笔模式: ${this.isDrawingMode ? '开启' : '关闭'}`)
      
      if (!this.fabricCanvas) {
        console.error('画布未初始化')
        return
      }
      
      this.fabricCanvas.isDrawingMode = this.isDrawingMode
      
      if (this.isDrawingMode) {
        // 开启画笔模式
        this.selectedTextIndex = -1 // 取消文字选择
        this.fabricCanvas.discardActiveObject()
        
        // 确保画笔设置正确
        this.updateBrushSettings()
        
        // 验证画笔状态
        console.log('画笔模式状态检查:', {
          isDrawingMode: this.fabricCanvas.isDrawingMode,
          hasBrush: !!this.fabricCanvas.freeDrawingBrush,
          brushWidth: this.fabricCanvas.freeDrawingBrush?.width,
          brushColor: this.fabricCanvas.freeDrawingBrush?.color
        })
        
        console.log('✅ 画笔模式已开启')
      } else {
        // 关闭画笔模式
        console.log('❌ 画笔模式已关闭')
      }
      
      this.fabricCanvas.renderAll()
    },

    updateBrushSettings() {
      if (!this.fabricCanvas) {
        console.log('画布未初始化，跳过画笔设置')
        return
      }
      
      // 确保画笔对象存在
      if (!this.fabricCanvas.freeDrawingBrush) {
        console.log('创建画笔对象...')
        this.fabricCanvas.freeDrawingBrush = new PencilBrush(this.fabricCanvas)
      }
      
      // 设置画笔属性
      this.fabricCanvas.freeDrawingBrush.width = this.brushSize
      this.fabricCanvas.freeDrawingBrush.color = this.hexToRgba(this.brushColor, this.brushOpacity)
      
      console.log(`画笔设置更新: 大小=${this.brushSize}, 颜色=${this.brushColor}, 透明度=${this.brushOpacity}`)
      console.log('当前画笔对象:', this.fabricCanvas.freeDrawingBrush)
    },

    // 将十六进制颜色转换为带透明度的rgba
    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },

    clearDrawings() {
      if (!this.fabricCanvas) return
      
      if (confirm('确定要清除当前帧的所有涂鸦吗？此操作不可撤销。')) {
        // 获取所有非文字对象（即涂鸦路径）
        const objects = this.fabricCanvas.getObjects()
        const drawingObjects = objects.filter(obj => 
          obj.type === 'path' && obj.textDataIndex === undefined
        )
        
        // 删除涂鸦对象
        drawingObjects.forEach(obj => {
          this.fabricCanvas.remove(obj)
        })
        
        this.fabricCanvas.renderAll()
        console.log(`已清除 ${drawingObjects.length} 个涂鸦对象`)
      }
    },

    saveCurrentFrameTexts() {
      if (!this.fabricCanvas) return
      
      const fabricObjects = this.fabricCanvas.getObjects()
      
      // 更新文字位置
      fabricObjects.forEach(obj => {
        if (obj.textDataIndex !== undefined) {
          const textData = this.currentFrame.texts[obj.textDataIndex]
          if (textData) {
            textData.left = obj.left
            textData.top = obj.top
          }
        }
      })
      
      // 保存涂鸦路径
      const drawings = fabricObjects.filter(obj => 
        obj.type === 'path' && obj.textDataIndex === undefined
      )
      
      // 确保当前帧有drawings数组
      if (!this.currentFrame.drawings) {
        this.currentFrame.drawings = []
      }
      
      // 序列化涂鸦对象
      this.currentFrame.drawings = drawings.map(path => ({
        type: 'path',
        path: path.path,
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
        fill: path.fill,
        left: path.left,
        top: path.top,
        scaleX: path.scaleX,
        scaleY: path.scaleY,
        angle: path.angle
      }))
      
      console.log(`保存了 ${this.currentFrame.drawings.length} 个涂鸦路径`)
    },

    // 播放控制方法
    togglePlay() {
      if (this.isPlaying) {
        this.stopPlay()
      } else {
        this.startPlay()
      }
    },

    startPlay() {
      if (this.isPlaying) return
      
      this.isPlaying = true
      this.playTimer = setInterval(() => {
        this.nextFrame()
      }, this.gifDelay)
      
      console.log('开始播放预览')
    },

    stopPlay() {
      if (!this.isPlaying) return
      
      this.isPlaying = false
      if (this.playTimer) {
        clearInterval(this.playTimer)
        this.playTimer = null
      }
      
      console.log('停止播放预览')
    },

    nextFrame() {
      // 保存当前帧的文字状态
      this.saveCurrentFrameTexts()
      
      // 切换到下一帧
      this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length
      this.selectedTextIndex = -1
      this.drawCurrentFrame()
    },

    prevFrame() {
      // 保存当前帧的文字状态
      this.saveCurrentFrameTexts()
      
      // 切换到上一帧
      this.currentFrameIndex = this.currentFrameIndex === 0 
        ? this.frames.length - 1 
        : this.currentFrameIndex - 1
      this.selectedTextIndex = -1
      this.drawCurrentFrame()
    },

    // 帧顺序变化处理
    onFrameOrderChange() {
      if (this.frames.length <= 1) {
        return
      }

      console.log('帧顺序变化为:', this.frameOrder)

      // 停止播放
      if (this.isPlaying) {
        this.stopPlay()
      }

      // 保存当前帧的文字状态
      this.saveCurrentFrameTexts()

      // 反转帧数组
      this.frames.reverse()

      // 调整当前帧索引（保持在相同的图片帧上）
      this.currentFrameIndex = this.frames.length - 1 - this.currentFrameIndex

      // 重新绘制当前帧
      this.selectedTextIndex = -1
      this.drawCurrentFrame()

      console.log('帧顺序已切换到:', this.frameOrder)
    },

    applyToAllFrames() {
      const hasTexts = this.currentFrame.texts.length > 0
      const hasDrawings = this.currentFrame.drawings && this.currentFrame.drawings.length > 0
      
      // 设置默认选择（只选择有内容的项目）
      this.applyTexts = hasTexts
      this.applyDrawings = hasDrawings
      
      // 设置默认范围
      this.applyStartFrame = 0
      this.applyEndFrame = this.frames.length - 1
      this.showApplyModal = true
    },

    applyToFrameRange() {
      // 检查是否有任何内容可以应用
      const hasTexts = this.currentFrame.texts.length > 0
      const hasDrawings = this.currentFrame.drawings && this.currentFrame.drawings.length > 0
      
      if (!hasTexts && !hasDrawings) {
        alert('当前帧没有文字或涂抹内容可以应用')
        return
      }

      // 检查是否有选择的内容
      if (!this.applyTexts && !this.applyDrawings) {
        alert('请至少选择一种内容进行应用')
        return
      }

      // 检查是否有对应的内容
      if (this.applyTexts && !hasTexts) {
        alert('当前帧没有文字可以应用')
        return
      }
      
      if (this.applyDrawings && !hasDrawings) {
        alert('当前帧没有涂抹可以应用')
        return
      }

      // 验证范围
      const start = Math.max(0, Math.min(this.applyStartFrame, this.frames.length - 1))
      const end = Math.max(start, Math.min(this.applyEndFrame, this.frames.length - 1))

      let appliedCount = 0
      const appliedItems = []
      
      for (let i = start; i <= end; i++) {
        // 跳过当前帧，避免重复应用
        if (i === this.currentFrameIndex) continue
        
        // 应用文字
        if (this.applyTexts && this.currentFrame.texts.length > 0) {
          const currentTexts = JSON.parse(JSON.stringify(this.currentFrame.texts))
          this.frames[i].texts = currentTexts
        }
        
        // 应用涂抹
        if (this.applyDrawings && this.currentFrame.drawings && this.currentFrame.drawings.length > 0) {
          // 确保目标帧有drawings数组
          if (!this.frames[i].drawings) {
            this.frames[i].drawings = []
          }
          const currentDrawings = JSON.parse(JSON.stringify(this.currentFrame.drawings))
          this.frames[i].drawings = currentDrawings
        }
        
        appliedCount++
      }

      // 构建应用内容说明
      if (this.applyTexts && this.currentFrame.texts.length > 0) {
        appliedItems.push('文字')
      }
      if (this.applyDrawings && this.currentFrame.drawings && this.currentFrame.drawings.length > 0) {
        appliedItems.push('涂抹')
      }

      this.showApplyModal = false
      alert(`${appliedItems.join('和')}已应用到第 ${start + 1} 帧到第 ${end + 1} 帧（共 ${appliedCount} 帧）`)
    },

    closeApplyModal() {
      this.showApplyModal = false
    },

    // 强制刷新涂抹状态
    forceRefreshDrawings() {
      console.log('强制刷新涂抹状态...')
      this.saveCurrentFrameTexts()
      console.log('涂抹状态已刷新，当前涂抹数量:', this.currentFrame.drawings ? this.currentFrame.drawings.length : 0)
      
      // 强制更新Vue的响应式系统
      this.$forceUpdate()
    },

    // 安全地重新初始化画布
    async safeReinitCanvas() {
      console.log('Safe reinitializing canvas...')
      
      // 先保存当前帧状态
      if (this.fabricCanvas) {
        this.saveCurrentFrameTexts()
      }
      
      // 等待DOM更新
      await this.$nextTick()
      
      // 重新初始化画布
      this.initCanvas()
      
      console.log('Canvas safely reinitialized')
    },

    validateRange() {
      // 确保起始帧不大于结束帧
      if (this.applyStartFrame > this.applyEndFrame) {
        this.applyEndFrame = this.applyStartFrame
      }
      
      // 确保范围在有效区间内
      this.applyStartFrame = Math.max(0, Math.min(this.applyStartFrame, this.frames.length - 1))
      this.applyEndFrame = Math.max(this.applyStartFrame, Math.min(this.applyEndFrame, this.frames.length - 1))
    },

    setRange(start, end) {
      this.applyStartFrame = start
      this.applyEndFrame = end
      this.validateRange()
    },

    applyToAllFramesLegacy() {
      const currentTexts = JSON.parse(JSON.stringify(this.currentFrame.texts))
      
      this.frames.forEach((frame, index) => {
        if (index !== this.currentFrameIndex) {
          frame.texts = JSON.parse(JSON.stringify(currentTexts))
        }
      })

      alert('已将当前帧的文字应用到所有帧')
    },

    async previewGif() {
      this.showPreview = true
      this.previewUrl = ''
      
      try {
        const blob = await this.createGif()
        this.previewUrl = URL.createObjectURL(blob)
      } catch (error) {
        console.error('预览失败:', error)
        alert('预览失败，请重试')
        this.closePreview()
      }
    },

    closePreview() {
      this.showPreview = false
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
        this.previewUrl = ''
      }
    },

    async generateGif() {
      this.isGenerating = true
      
      try {
        const blob = await this.createGif()
        saveAs(blob, 'doro-with-text.gif')
        this.isGenerating = false
      } catch (error) {
        console.error('生成失败:', error)
        alert('生成失败，请重试')
        this.isGenerating = false
      }
    },

    async createGif() {
      console.log('开始创建 GIF，总帧数:', this.frames.length)
      
      // 保存当前状态
      const originalIndex = this.currentFrameIndex
      this.saveCurrentFrameTexts()

      try {
        const frames = []
        
        // 串行处理帧，确保每帧都正确生成
        for (let i = 0; i < this.frames.length; i++) {
          console.log(`处理第 ${i + 1} 帧...`)
          this.currentFrameIndex = i
          
          const frameCanvas = await this.createFrameCanvas(i)
          
          // modern-gif 需要的格式：直接传递 Canvas 元素
          frames.push({
            data: frameCanvas,
            delay: this.gifDelay
          })
          console.log(`第 ${i + 1} 帧处理成功`)
        }

        console.log('开始编码GIF...')
        
        // 使用 modern-gif 生成 GIF (正确的API)
        const gifBuffer = await encode({
          width: this.canvasSize.width,
          height: this.canvasSize.height,
          frames: frames
        })

        console.log('GIF编码完成')
        
        // 恢复原始状态
        this.currentFrameIndex = originalIndex
        this.drawCurrentFrame()

        return new Blob([gifBuffer], { type: 'image/gif' })
        
      } catch (error) {
        console.error('GIF生成失败:', error)
        // 恢复原始状态
        this.currentFrameIndex = originalIndex
        this.drawCurrentFrame()
        throw error
      }
    },

    async createFrameCanvas(frameIndex) {
      try {
        // 创建临时画布
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = this.canvasSize.width
        tempCanvas.height = this.canvasSize.height
        const ctx = tempCanvas.getContext('2d')

        const frame = this.frames[frameIndex]
        
        // 验证图片对象的有效性
        if (!frame || !frame.img) {
          throw new Error(`Frame ${frameIndex} or its image is missing`)
        }
        
        // 检查图片是否已完全加载
        if (!frame.img.complete || frame.img.naturalWidth === 0) {
          console.warn(`Image for frame ${frameIndex} not fully loaded, reloading...`)
          
          // 如果图片没有完全加载，重新加载
          return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            img.onload = () => {
              try {
                // 更新缓存的图片对象
                frame.img = img
                
                // 绘制背景图片
                ctx.drawImage(img, 0, 0, this.canvasSize.width, this.canvasSize.height)
                
                // 绘制文字
                this.drawTextsOnCanvas(ctx, frame.texts)
                
                resolve(tempCanvas)
              } catch (error) {
                reject(error)
              }
            }
            
            img.onerror = (error) => {
              reject(new Error(`Failed to reload image for frame ${frameIndex}: ${frame.src}`))
            }
            
            img.src = frame.src
          })
        }
        
        console.log(`Creating frame canvas ${frameIndex} using cached image`)
        
        // 绘制背景图片（使用已缓存的图片对象）
        ctx.drawImage(frame.img, 0, 0, this.canvasSize.width, this.canvasSize.height)

        // 绘制文字
        this.drawTextsOnCanvas(ctx, frame.texts)

        return tempCanvas
        
      } catch (error) {
        console.error('创建画布失败:', error)
        throw error
      }
    },

    // 辅助方法：在画布上绘制文字
    drawTextsOnCanvas(ctx, texts) {
      texts.forEach((textData) => {
        ctx.save()
        ctx.font = `${textData.fontWeight} ${textData.fontSize}px ${textData.fontFamily}`
        ctx.fillStyle = textData.fill
        ctx.strokeStyle = textData.stroke
        ctx.lineWidth = textData.strokeWidth
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        // 处理多行文字
        const lines = textData.text.split('\n')
        lines.forEach((line, lineIndex) => {
          const y = textData.top + (lineIndex * textData.fontSize * 1.2)
          
          // 如果有描边，先绘制描边
          if (textData.strokeWidth > 0) {
            ctx.strokeText(line, textData.left, y)
          }
          
          // 绘制填充文字
          ctx.fillText(line, textData.left, y)
        })
        
        ctx.restore()
      })
    },

    // 项目保存/加载功能
    loadSavedProjectsList() {
      try {
        const saved = localStorage.getItem('gif-editor-projects')
        if (saved) {
          this.savedProjects = JSON.parse(saved)
          console.log('已加载保存的项目列表:', this.savedProjects.length, '个项目')
        }
      } catch (error) {
        console.error('加载项目列表失败:', error)
        this.savedProjects = []
      }
    },

    showSaveProjectModal() {
      this.currentProjectName = ''
      this.showSaveModal = true
    },

    showLoadProjectModal() {
      this.loadSavedProjectsList()
      this.showLoadModal = true
    },

    saveCurrentProject() {
      if (!this.currentProjectName.trim()) {
        alert('请输入项目名称')
        return
      }

      // 保存当前帧的文字状态
      this.saveCurrentFrameTexts()

      const projectData = {
        name: this.currentProjectName.trim(),
        frames: this.frames.map(frame => ({
          src: frame.src,
          texts: JSON.parse(JSON.stringify(frame.texts)),
          drawings: JSON.parse(JSON.stringify(frame.drawings || []))
        })),
        settings: {
          gifDelay: this.gifDelay,
          frameOrder: this.frameOrder,
          defaultTextStyle: JSON.parse(JSON.stringify(this.defaultTextStyle)),
          canvasSize: { ...this.canvasSize }
        },
        // 包含图片数据用于完整保存
        imageData: this.hasCustomImages ? {
          type: this.originalImageData?.type || 'custom',
          frames: this.originalImageData?.frames || this.frames.map(frame => ({
            dataUrl: frame.src,
            texts: frame.texts,
            drawings: frame.drawings || []
          })),
          gifInfo: this.originalImageData?.gifInfo || null
        } : null,
        savedAt: new Date().toISOString(),
        timestamp: Date.now()
      }

      // 检查是否已存在同名项目
      const existingIndex = this.savedProjects.findIndex(p => p.name === projectData.name)
      if (existingIndex !== -1) {
        if (!confirm(`项目 "${projectData.name}" 已存在，是否覆盖？`)) {
          return
        }
        this.savedProjects[existingIndex] = projectData
      } else {
        this.savedProjects.unshift(projectData) // 新项目添加到最前面
      }

      // 限制保存的项目数量（最多20个）
      if (this.savedProjects.length > 20) {
        this.savedProjects = this.savedProjects.slice(0, 20)
      }

      try {
        localStorage.setItem('gif-editor-projects', JSON.stringify(this.savedProjects))
        console.log('项目保存成功:', projectData.name)
        alert(`项目 "${projectData.name}" 保存成功！`)
        this.showSaveModal = false
      } catch (error) {
        console.error('保存项目失败:', error)
        alert('保存失败，可能是存储空间不足')
      }
    },

    loadProject(project) {
      this.selectedProject = project
      this.prepareTextReplacements(project)
      this.showLoadModal = false
      this.showTextReplaceModal = true
    },

    // 准备文字替换数据
    prepareTextReplacements(project) {
      const allTexts = new Set()
      
      // 收集所有不重复的文字内容
      project.frames.forEach(frame => {
        frame.texts.forEach(text => {
          allTexts.add(text.text)
        })
      })

      // 创建替换映射
      this.textReplacements = Array.from(allTexts).map(originalText => ({
        original: originalText,
        replacement: originalText,
        preview: originalText.slice(0, 30) + (originalText.length > 30 ? '...' : '')
      }))
    },

    // 直接加载项目（不替换文字）
    loadProjectDirectly(project) {
      if (!confirm(`确定要加载项目 "${project.name}"？当前未保存的修改将丢失。`)) {
        return
      }

      try {
        this.applyProjectData(project)
        console.log('项目加载成功:', project.name)
        alert(`项目 "${project.name}" 加载成功！`)
        this.showLoadModal = false
      } catch (error) {
        console.error('加载项目失败:', error)
        alert('加载项目失败')
      }
    },

    // 应用项目作为预设（只应用文字和涂抹，保持当前图片）
    applyProjectAsPreset(project) {
      if (!confirm(`确定要应用预设 "${project.name}" 到当前图片？\n\n这将清除当前的文字和涂抹，但保持图片不变。`)) {
        return
      }

      try {
        this.applyProjectData(project, true) // 第二个参数为 true，只应用文字和涂抹
        console.log('预设应用成功:', project.name)
        alert(`预设 "${project.name}" 应用成功！文字和涂抹已应用到当前图片。`)
        this.showLoadModal = false
      } catch (error) {
        console.error('应用预设失败:', error)
        alert('应用预设失败')
      }
    },

    // 带文字替换的加载项目
    loadProjectWithReplacements() {
      if (!this.selectedProject) return

      try {
        // 创建替换映射
        const replacementMap = {}
        this.textReplacements.forEach(item => {
          replacementMap[item.original] = item.replacement
        })

        // 克隆项目数据并替换文字
        const modifiedProject = JSON.parse(JSON.stringify(this.selectedProject))
        modifiedProject.frames.forEach(frame => {
          frame.texts.forEach(text => {
            if (replacementMap.hasOwnProperty(text.text)) {
              text.text = replacementMap[text.text]
            }
          })
        })

        this.applyProjectData(modifiedProject)
        console.log('项目加载成功（已替换文字）:', this.selectedProject.name)
        alert(`项目 "${this.selectedProject.name}" 加载成功！文字已替换。`)
        this.closeTextReplaceModal()

      } catch (error) {
        console.error('加载项目失败:', error)
        alert('加载项目失败')
      }
    },

    // 应用项目数据到当前编辑器
    async applyProjectData(project, onlyTextAndDrawings = false) {
      // 停止播放
      this.stopPlay()

      // 恢复设置
      this.gifDelay = project.settings.gifDelay || 80
      this.frameOrder = project.settings.frameOrder || 'normal'
      this.defaultTextStyle = { ...project.settings.defaultTextStyle }
      if (project.settings.canvasSize) {
        this.canvasSize = { ...project.settings.canvasSize }
      }

      // 检查是否只应用文字和涂抹数据
      if (onlyTextAndDrawings) {
        console.log('Applying only texts and drawings - keeping current images')
        
        // 保持当前图片状态，不重新加载图片
        // 只清空现有的文字和涂抹，然后应用新的
        this.frames.forEach(frame => {
          frame.texts = []
          frame.drawings = []
        })
        
        // 应用文字和涂抹数据
        project.frames.forEach((savedFrame, index) => {
          if (this.frames[index]) {
            this.frames[index].texts = JSON.parse(JSON.stringify(savedFrame.texts))
            this.frames[index].drawings = JSON.parse(JSON.stringify(savedFrame.drawings || []))
          }
        })
        
        // 只重新绘制当前帧，不重新初始化画布
        await this.$nextTick()
        if (this.fabricCanvas) {
          this.drawCurrentFrame()
        } else {
          await this.safeReinitCanvas()
        }
      } else if (project.imageData && project.imageData.frames) {
        console.log('Loading project with custom images')
        this.originalImageData = project.imageData
        this.hasCustomImages = true
        
        // 重新加载帧（这会使用 originalImageData）
        await this.loadFrames()
        
        // 应用文字和涂抹数据
        project.frames.forEach((savedFrame, index) => {
          if (this.frames[index]) {
            this.frames[index].texts = JSON.parse(JSON.stringify(savedFrame.texts))
            this.frames[index].drawings = JSON.parse(JSON.stringify(savedFrame.drawings || []))
          }
        })
        
        // 重新初始化画布
        await this.safeReinitCanvas()
      } else {
        console.log('Loading project without images - keeping current images')
        
        // 保持当前图片状态，不重新加载图片
        // 只清空现有的文字和涂抹，然后应用新的
        this.frames.forEach(frame => {
          frame.texts = []
          frame.drawings = []
        })
        
        // 应用文字和涂抹数据
        project.frames.forEach((savedFrame, index) => {
          if (this.frames[index]) {
            this.frames[index].texts = JSON.parse(JSON.stringify(savedFrame.texts))
            this.frames[index].drawings = JSON.parse(JSON.stringify(savedFrame.drawings || []))
          }
        })
        
        // 只重新绘制当前帧，不重新初始化画布
        await this.$nextTick()
        if (this.fabricCanvas) {
          this.drawCurrentFrame()
        } else {
          await this.safeReinitCanvas()
        }
      }

      // 重置当前状态
      this.currentFrameIndex = 0
      this.selectedTextIndex = -1
    },

    // 快速填充相同文字
    quickFillText(index) {
      const newText = prompt('请输入要填充的文字:')
      if (newText !== null) {
        this.textReplacements[index].replacement = newText
      }
    },

    // 关闭文字替换模态框
    closeTextReplaceModal() {
      this.showTextReplaceModal = false
      this.selectedProject = null
      this.textReplacements = []
    },

    deleteProject(project, index) {
      if (!confirm(`确定要删除项目 "${project.name}"？此操作不可撤销。`)) {
        return
      }

      this.savedProjects.splice(index, 1)
      
      try {
        localStorage.setItem('gif-editor-projects', JSON.stringify(this.savedProjects))
        console.log('项目删除成功:', project.name)
      } catch (error) {
        console.error('删除项目失败:', error)
      }
    },

    exportProject(project) {
      try {
        const dataStr = JSON.stringify(project, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `${project.name}.json`
        link.click()
        
        URL.revokeObjectURL(url)
        console.log('项目导出成功:', project.name)
      } catch (error) {
        console.error('导出项目失败:', error)
        alert('导出失败')
      }
    },

    importProject() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const projectData = JSON.parse(e.target.result)
            
            // 验证项目数据格式
            if (!projectData.name || !projectData.frames || !projectData.settings) {
              throw new Error('无效的项目文件格式')
            }

            // 检查是否已存在同名项目
            const existingIndex = this.savedProjects.findIndex(p => p.name === projectData.name)
            if (existingIndex !== -1) {
              if (!confirm(`项目 "${projectData.name}" 已存在，是否覆盖？`)) {
                return
              }
            }

            // 添加导入时间戳
            projectData.importedAt = new Date().toISOString()
            
            if (existingIndex !== -1) {
              this.savedProjects[existingIndex] = projectData
            } else {
              this.savedProjects.unshift(projectData)
            }

            localStorage.setItem('gif-editor-projects', JSON.stringify(this.savedProjects))
            
            console.log('项目导入成功:', projectData.name)
            alert(`项目 "${projectData.name}" 导入成功！`)
            this.loadSavedProjectsList()

          } catch (error) {
            console.error('导入项目失败:', error)
            alert('导入失败：文件格式错误或已损坏')
          }
        }
        
        reader.readAsText(file)
      }
      
      input.click()
    },

    closeSaveModal() {
      this.showSaveModal = false
    },

    closeLoadModal() {
      this.showLoadModal = false
    },

    formatDate(dateString) {
      try {
        return new Date(dateString).toLocaleString('zh-CN')
      } catch {
        return '未知时间'
      }
    },

    // 精选预设功能
    showCloudPresets() {
      this.showCloudModal = true
      this.loadCloudPresets()
    },

    // API 基础 URL
    getApiUrl(path) {
      return `${this.workerApiUrl}${path}`
    },

    async loadCloudPresets() {
      this.isLoadingCloud = true
      try {
        // 调用 Cloudflare Workers API
        const response = await fetch(this.getApiUrl('/api/presets'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.cloudPresets = data.presets || []
          console.log('加载精选预设成功:', this.cloudPresets.length, '个')
        } else {
          console.error('加载精选预设失败:', response.statusText)
          this.cloudPresets = []
        }
      } catch (error) {
        console.error('网络错误:', error)
        this.cloudPresets = []
        // 显示示例数据（当 API 不可用时）
        this.loadExamplePresets()
      }
      this.isLoadingCloud = false
    },

    // 加载示例预设（当 API 不可用时）
    loadExamplePresets() {
      this.cloudPresets = [
        {
          id: 'example-1',
          name: '生日祝福模板',
          description: '适合生日祝福的动画模板，包含多个文字位置（示例数据）',
          author: 'youtiaoguagua',
          tags: ['生日', '祝福', '庆祝'],
          downloads: 128,
          createdAt: '2024-01-15T10:30:00Z',
          frames: 19
        },
        {
          id: 'example-2', 
          name: '新年贺卡',
          description: '新年祝福专用模板，红色主题设计（示例数据）',
          author: 'designer123',
          tags: ['新年', '贺卡', '红色'],
          downloads: 89,
          createdAt: '2024-01-10T15:20:00Z',
          frames: 19
        }
      ]
    },

    showUploadPreset() {
      this.uploadTitle = ''
      this.uploadDescription = ''
      this.showUploadModal = true
      
      // 等待模态框渲染完成后初始化预览
      this.$nextTick(() => {
        this.initUploadPreview()
      })
    },

    // 初始化上传预览
    async initUploadPreview() {
      const previewContainer = this.$refs.previewContainer
      if (!previewContainer) return

      try {
        // 显示加载状态
        previewContainer.innerHTML = '<div class="preview-loading">🔄 正在生成预览GIF...</div>'
        
        // 生成预览GIF
        console.log('正在生成预览GIF...')
        const previewGifBlob = await this.createGif()
        
        // 清空容器并添加GIF图片
        previewContainer.innerHTML = ''
        
        const img = document.createElement('img')
        img.src = URL.createObjectURL(previewGifBlob)
        img.alt = '预设预览'
        img.className = 'preview-gif'
        img.style.maxWidth = '100%'
        img.style.maxHeight = '100%'
        img.style.borderRadius = '4px'
        img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
        
        // 添加加载完成事件
        img.onload = () => {
          console.log('预览GIF显示成功')
        }
        
        img.onerror = () => {
          console.error('预览GIF显示失败')
          this.initStaticPreview()
        }
        
        previewContainer.appendChild(img)
        
      } catch (error) {
        console.error('生成预览GIF失败:', error)
        
        // 如果GIF生成失败，显示静态预览
        await this.initStaticPreview()
      }
    },

    // 静态预览作为备选方案
    async initStaticPreview() {
      const previewCanvas = this.$refs.previewCanvas
      if (!previewCanvas) return

      // 设置预览canvas尺寸
      const previewSize = 200
      previewCanvas.width = previewSize
      previewCanvas.height = previewSize
      
      try {
        // 生成当前帧的预览
        const currentFrame = this.frames[this.currentFrameIndex]
        if (currentFrame) {
          const frameCanvas = await this.createFrameCanvas(this.currentFrameIndex)
          
          // 将帧canvas绘制到预览canvas上（缩放）
          const ctx = previewCanvas.getContext('2d')
          ctx.clearRect(0, 0, previewSize, previewSize)
          ctx.drawImage(frameCanvas, 0, 0, previewSize, previewSize)
        }
      } catch (error) {
        console.error('初始化静态预览失败:', error)
      }
    },

    async uploadCurrentProject() {
      if (!this.uploadTitle.trim()) {
        alert('请输入预设标题')
        return
      }
      
      if (!this.uploadDescription.trim()) {
        alert('请输入项目描述')
        return
      }

      this.isUploading = true
      try {
        // 保存当前帧的文字状态
        this.saveCurrentFrameTexts()

        // 生成预览GIF
        console.log('正在生成预览GIF...')
        const previewGifBlob = await this.createGif()
        
        // 将GIF转为base64
        const previewGifBase64 = await this.blobToBase64(previewGifBlob)

        const projectData = {
          name: this.uploadTitle.trim(),
          description: this.uploadDescription.trim(),
          tags: [], // 不再使用标签
          author: 'anonymous', // 可以后续添加用户系统
          frames: this.frames.map(frame => ({
            src: frame.src,
            texts: JSON.parse(JSON.stringify(frame.texts)),
            drawings: JSON.parse(JSON.stringify(frame.drawings || []))
          })),
          settings: {
            gifDelay: this.gifDelay,
            defaultTextStyle: JSON.parse(JSON.stringify(this.defaultTextStyle)),
            canvasSize: { ...this.canvasSize }
          },
          // 包含图片数据用于完整分享
          imageData: this.hasCustomImages ? {
            type: this.originalImageData?.type || 'custom',
            frames: this.originalImageData?.frames || this.frames.map(frame => ({
              dataUrl: frame.src,
              texts: frame.texts,
              drawings: frame.drawings || []
            })),
            gifInfo: this.originalImageData?.gifInfo || null
          } : null,
          // 添加预览GIF
          previewGif: previewGifBase64
        }

        const response = await fetch(this.getApiUrl('/api/presets'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(projectData)
        })

        if (response.ok) {
          const result = await response.json()
          alert(`预设上传成功！ID: ${result.id}`)
          this.showUploadModal = false
          this.loadCloudPresets() // 刷新列表
        } else {
          alert('上传失败，请稍后重试')
        }
      } catch (error) {
        console.error('上传预设失败:', error)
        alert('网络错误，请检查连接后重试')
      }
      this.isUploading = false
    },

    async downloadCloudPreset(preset) {
      if (preset.id.startsWith('example-')) {
        alert('这是示例数据，请使用真实的精选预设')
        return
      }

      try {
        const response = await fetch(this.getApiUrl(`/api/presets/${preset.id}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const projectData = await response.json()
          
          // 检查是否已存在同名项目
          const existingIndex = this.savedProjects.findIndex(p => p.name === projectData.name)
          if (existingIndex !== -1) {
            if (!confirm(`项目 "${projectData.name}" 已存在，是否覆盖？`)) {
              return
            }
          }

          // 添加下载标记
          projectData.downloadedFrom = preset.id
          projectData.originalAuthor = preset.author
          projectData.downloadedAt = new Date().toISOString()

          if (existingIndex !== -1) {
            this.savedProjects[existingIndex] = projectData
          } else {
            this.savedProjects.unshift(projectData)
          }

          localStorage.setItem('gif-editor-projects', JSON.stringify(this.savedProjects))
          
          // 询问用户是否立即应用预设
          if (confirm(`预设 "${preset.name}" 下载成功！\n\n是否立即应用到当前图片？（只会应用文字和涂抹，不会更改图片）`)) {
            try {
              await this.applyProjectData(projectData, true)
              alert('预设已成功应用到当前图片！')
            } catch (error) {
              console.error('应用预设失败:', error)
              alert('应用预设失败，但预设已保存到项目列表中')
            }
          } else {
            alert(`预设 "${preset.name}" 已保存到项目列表！`)
          }
          
          this.showCloudModal = false

          // 更新下载计数
          this.incrementDownloadCount(preset.id)

        } else {
          alert('下载失败，请稍后重试')
        }
      } catch (error) {
        console.error('下载预设失败:', error)
        alert('网络错误，请检查连接后重试')
      }
    },

    async incrementDownloadCount(presetId) {
      try {
        await fetch(this.getApiUrl(`/api/presets/${presetId}/download`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.error('更新下载计数失败:', error)
      }
    },

    // 辅助函数：将Blob转为base64
    async blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    },

    async deleteCloudPreset(preset) {
      if (preset.id.startsWith('example-')) {
        alert('这是示例数据，无法删除')
        return
      }

      if (!confirm(`确定要删除预设 "${preset.name}" 吗？\n\n此操作不可撤销！`)) {
        return
      }

      try {
        const response = await fetch(this.getApiUrl(`/api/presets/${preset.id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          alert(`预设 "${preset.name}" 删除成功！`)
          
          // 从本地列表中移除
          this.cloudPresets = this.cloudPresets.filter(p => p.id !== preset.id)
          
        } else {
          const error = await response.json()
          alert(`删除失败: ${error.error || '未知错误'}`)
        }
      } catch (error) {
        console.error('删除预设失败:', error)
        alert('网络错误，请检查连接后重试')
      }
    },

    closeCloudModal() {
      this.showCloudModal = false
      this.cloudPresets = []
    },

    closeUploadModal() {
      this.showUploadModal = false
      this.uploadTitle = ''
      this.uploadDescription = ''
    },

    showPresetDetails(preset) {
      // 显示详细信息的提示框
      const details = [
        `📝 描述: ${preset.description}`,
        `👤 作者: ${preset.author}`,
        `📅 创建时间: ${this.formatDate(preset.createdAt)}`,
        `🎞️ 帧数: ${preset.frames}`,
        `📥 下载量: ${preset.downloads}`,
        preset.hasCustomImages ? `🖼️ 包含自定义图片` : '',
        preset.dataSize ? `💾 大小: ${preset.dataSize}KB` : ''
      ].filter(item => item).join('\n\n')
      
      alert(details)
    },


  }
}
</script>

<style scoped>
#app {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background: url('@/assets/bg2.png') repeat;
  background-size: 250px 250px;
  min-height: 100vh;
  padding: 20px 20px 80px 20px; /* 底部增加80px避免被页脚遮挡 */
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 1.5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.header p {
  font-size: 1.2em;
  margin: 10px 0;
  opacity: 0.9;
}

.main-container {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.frames-panel {
  width: 200px;
  background: rgba(255, 255, 255, 1);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  height: fit-content;
  max-height: 80vh;
  overflow-y: auto;
}

.frames-panel h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1em;
}

.frames-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.frame-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.frame-item:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.frame-item.active {
  border-color: #764ba2;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
}

.frame-item img {
  width: 100%;
  height: 60px;
  object-fit: cover;
  display: block;
}

.frame-number {
  position: absolute;
  bottom: 2px;
  right: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
}

.editor-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.editor-header h3 {
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
  width: 100%;
  justify-content: center;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-outline:hover {
  background: #f8f9fa;
  color: #495057;
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline:disabled:hover {
  background: transparent;
  color: #6c757d;
}

/* 帧控制区域样式 */
.frame-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.frame-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.current-frame {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.playing-indicator {
  font-size: 12px;
  color: #28a745;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  min-height: 400px;
}

canvas {
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.settings-panel {
  width: 280px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  height: fit-content;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-panel h3, .settings-panel h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1em;
}

.text-settings {
  margin-bottom: 20px;
}

/* 画笔设置样式 */
.brush-settings {
  margin-bottom: 20px;
  border-top: 2px solid #f0f0f0;
  padding-top: 15px;
}

.brush-controls {
  margin-top: 10px;
}

.brush-settings h3 {
  color: #333;
  font-size: 1.1em;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-group {
  margin-bottom: 15px;
}

.setting-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.setting-group input, .setting-group select, .setting-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.setting-group input:focus, .setting-group select:focus, .setting-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.setting-group input[type="range"] {
  padding: 0;
}

.setting-group input[type="color"] {
  height: 40px;
  padding: 2px;
  cursor: pointer;
}

.no-text-selected {
  text-align: center;
  color: #666;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.texts-list {
  margin-bottom: 20px;
}

.text-item {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.text-item:hover {
  background: #e9ecef;
}

.text-item.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.text-preview {
  font-size: 12px;
}

.global-settings {
  border-top: 2px solid #f0f0f0;
  padding-top: 15px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 20px;
  text-align: center;
}

.modal-body img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* 应用范围选择模态框样式 */
.apply-modal {
  max-width: 500px;
  width: 90%;
}

.apply-content-selection {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.content-option {
  margin-bottom: 15px;
}

.content-option:last-child {
  margin-bottom: 0;
}

.content-option label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #495057;
  cursor: pointer;
  margin-bottom: 8px;
}

.content-option input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.content-preview {
  margin-left: 24px;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.text-preview-item {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #495057;
  margin-bottom: 4px;
  display: inline-block;
  margin-right: 6px;
}

.text-preview-item:last-child {
  margin-bottom: 0;
}

.no-content {
  margin-left: 24px;
  font-size: 12px;
  color: #9e9e9e;
  font-style: italic;
}

.no-any-content {
  text-align: center;
  padding: 20px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  color: #856404;
}

.no-any-content p {
  margin: 8px 0;
}

.no-any-content p:first-child {
  font-weight: 600;
  font-size: 16px;
}

.no-any-content p:last-child {
  font-size: 14px;
  margin-bottom: 0;
}

.apply-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.apply-info p {
  margin: 0 0 10px 0;
  color: #495057;
  font-weight: 500;
}

.text-preview-list {
  max-height: 100px;
  overflow-y: auto;
}

.text-preview-item {
  padding: 5px 10px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
}

.range-settings {
  margin-bottom: 20px;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-input input {
  width: 80px;
  flex-shrink: 0;
}

.frame-label {
  color: #666;
  font-size: 14px;
}

.range-preview {
  margin-top: 15px;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 4px;
  text-align: center;
}

.range-preview p {
  margin: 0;
  color: #1976d2;
  font-weight: 500;
}

.quick-options {
  margin-bottom: 20px;
}

.quick-options h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 16px;
}

.quick-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    border-top: 1px solid #e9ecef;
    padding-top: 15px;
  }

/* 项目管理样式 */
.project-management {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.project-management h3 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 16px;
}

.project-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-buttons .btn {
  text-align: left;
  justify-content: flex-start;
  font-size: 13px;
  padding: 8px 12px;
}

/* 保存/加载项目模态框样式 */
.save-modal, .load-modal {
  width: 500px;
  max-width: 90vw;
}

.save-info {
  background: #e8f5e8;
  padding: 12px;
  border-radius: 6px;
  margin: 15px 0;
  color: #2e7d32;
  font-size: 14px;
  border: 1px solid #c8e6c9;
}

.no-projects {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-projects p {
  margin: 8px 0;
}

.projects-list {
  max-height: 400px;
  overflow-y: auto;
}

.project-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.project-item:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.project-info {
  flex: 1;
}

.project-info h4 {
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 16px;
  font-weight: bold;
}

.project-details {
  margin: 4px 0;
  color: #6c757d;
  font-size: 13px;
}

.project-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}

.project-actions .btn {
  min-width: 60px;
  text-align: center;
}

/* 文字替换模态框样式 */
.text-replace-modal {
  width: 700px;
  max-width: 95vw;
  max-height: 80vh;
  overflow-y: auto;
}

.replace-info {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #bbdefb;
}

.replace-info p {
  margin: 5px 0;
  color: #1565c0;
}

.text-replacements {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 10px;
  background: #f8f9fa;
}

.replacement-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.replacement-item:last-child {
  margin-bottom: 0;
}

.replacement-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 15px;
  align-items: start;
}

.original-text, .new-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.original-text label, .new-text label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.original-text .text-preview {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px 12px;
  color: #6c757d;
  font-size: 14px;
  word-break: break-all;
  max-height: 60px;
  overflow-y: auto;
}

.arrow {
  color: #007bff;
  font-size: 18px;
  font-weight: bold;
  align-self: center;
  margin-top: 20px;
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.input-group textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 50px;
}

.input-group textarea:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.btn-xs {
  padding: 4px 6px;
  font-size: 12px;
  min-width: 30px;
  height: 30px;
  flex-shrink: 0;
}

.no-text {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .text-replace-modal {
    width: 95vw;
    margin: 10px;
  }
  
  .replacement-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .arrow {
    text-align: center;
    margin: 5px 0;
    transform: rotate(90deg);
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .btn-xs {
    align-self: flex-start;
  }
}

/* 精选预设样式 */
.cloud-modal {
  width: 1000px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
}

.upload-modal {
  width: 700px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
}

.cloud-info, .upload-info {
  background: #e8f5e8;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #c8e6c9;
}

.cloud-info p, .upload-info p {
  margin: 5px 0;
  color: #2e7d32;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-cloud-presets {
  text-align: center;
  padding: 40px;
  color: #666;
}



/* 网格布局 */
.cloud-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  padding: 0;
}

/* 预设卡片样式 */
.preset-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 260px;
}

.preset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

/* 预设预览区域 */
.preset-card-preview {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-gif-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.no-preview {
  font-size: 48px;
  color: #ced4da;
}

.preset-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent, rgba(0,0,0,0.3));
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preset-card:hover .preset-card-overlay {
  opacity: 1;
}

.quick-stats {
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  gap: 8px;
}

/* 卡片内容区域 */
.preset-card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preset-card-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-card-description {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}



/* 卡片底部 */
.preset-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.preset-author {
  font-size: 11px;
  color: #6c757d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.preset-card-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f8f9fa;
}

.btn-icon.btn-danger:hover {
  background: #f8d7da;
  color: #dc3545;
}



/* 上传预设样式 */
.upload-form {
  margin-bottom: 20px;
}

.upload-form .setting-group {
  margin-bottom: 20px;
}

.upload-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.upload-form textarea, .upload-form input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.upload-form textarea:focus, .upload-form input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.upload-form small {
  display: block;
  margin-top: 5px;
  color: #6c757d;
  font-size: 12px;
}



/* 上传预览样式 */
.upload-preview-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.current-gif-preview {
  flex-shrink: 0;
  width: 240px;
}

.current-gif-preview h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 14px;
}

.gif-preview-container {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 10px;
  background: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 220px;
}

.preview-canvas {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 100%;
}

.upload-details {
  flex: 1;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .upload-preview-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .current-gif-preview {
    width: 100%;
  }
  
  .gif-preview-container {
    min-height: 200px;
  }
}

/* 原有响应式样式 */
@media (max-width: 768px) {
  .cloud-modal {
    width: 95vw;
    margin: 10px;
  }
  
  .upload-modal {
    width: 95vw;
    margin: 10px;
  }
  
  .cloud-presets-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 15px;
  }
  
  .preset-card {
    height: 320px;
  }
  
  .preset-card-preview {
    height: 150px;
  }
  
  .preset-card-content {
    padding: 12px;
  }
  
  .preset-card-title {
    font-size: 14px;
  }
  
  .preset-card-description {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .cloud-presets-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .preset-card {
    height: 300px;
  }
  
  .preset-card-preview {
    height: 140px;
  }
}

/* 图片上传模态框样式 */
.upload-image-modal {
  width: 500px;
  max-width: 90vw;
}

.upload-image-info {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #bbdefb;
}

.upload-image-info p {
  margin: 5px 0;
  color: #1565c0;
}

.processing {
  text-align: center;
  padding: 40px;
  color: #666;
}

.upload-zone {
  margin-bottom: 20px;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
}

.drop-zone:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.drop-zone.dragover {
  border-color: #007bff;
  background: #e3f2fd;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.drop-content p {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.drop-content small {
  color: #666;
  font-size: 14px;
}

.current-image-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 20px;
}

.current-image-info h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 16px;
}

.current-image-info p {
  margin: 5px 0;
  color: #6c757d;
  font-size: 14px;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .upload-image-modal {
    width: 95vw;
    margin: 10px;
  }
  
  .drop-zone {
    padding: 30px 20px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
}

/* 页脚样式 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
}

.footer p {
  margin: 0;
}

.signature {
  color: #ffffff;
  font-weight: 600;
  /* text-shadow: 1px 1px 2px rgba(0,0,0,0.3); */
  background: #f0f0f0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 12px;
  letter-spacing: 1px;
}

/* Safari和其他不支持background-clip: text的浏览器的回退样式 */
@supports not (-webkit-background-clip: text) {
  .signature {
    color: #ffffff;
    -webkit-text-fill-color: initial;
  }
}

/* 面板滚动条样式 */
.frames-panel::-webkit-scrollbar,
.settings-panel::-webkit-scrollbar {
  width: 6px;
}

.frames-panel::-webkit-scrollbar-track,
.settings-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.frames-panel::-webkit-scrollbar-thumb,
.settings-panel::-webkit-scrollbar-thumb {
  background: rgba(118, 75, 162, 0.4);
  border-radius: 3px;
  transition: all 0.3s ease;
}

.frames-panel::-webkit-scrollbar-thumb:hover,
.settings-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(118, 75, 162, 0.6);
}

/* Firefox 滚动条样式 */
.frames-panel,
.settings-panel {
  scrollbar-width: thin;
  scrollbar-color: rgba(118, 75, 162, 0.4) rgba(0, 0, 0, 0.05);
}
  
    @media (max-width: 1200px) {
    #app {
      padding: 15px 15px 80px 15px;
    }
    
    .main-container {
      flex-direction: column;
    }
    
    .frames-panel, .settings-panel {
      width: 100%;
      max-height: 50vh;
    }
    
    .frames-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }
  }
</style>
