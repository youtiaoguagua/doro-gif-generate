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
          <h3>编辑帧 {{ currentFrameIndex + 1 }}</h3>
          <div class="controls">
            <button @click="addText" class="btn btn-primary">
              <span>➕</span> 添加文字
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
            <button @click="showSaveProjectModal" class="btn btn-primary btn-sm">
              💾 保存项目
            </button>
            <button @click="showLoadProjectModal" class="btn btn-info btn-sm">
              📁 加载项目
            </button>
            <button @click="importProject" class="btn btn-secondary btn-sm">
              📥 导入项目
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
            <p>将当前帧（第 {{ currentFrameIndex + 1 }} 帧）的文字应用到指定范围：</p>
            <div class="text-preview-list">
              <div v-for="(text, index) in currentFrame.texts" :key="index" class="text-preview-item">
                "{{ text.text.slice(0, 20) }}{{ text.text.length > 20 ? '...' : '' }}"
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
            <button @click="applyToFrameRange" class="btn btn-primary">应用到选定范围</button>
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
            将保存当前所有帧的文字内容、位置、样式以及全局设置
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
              </div>
                             <div class="project-actions">
                <button @click="loadProject(project)" class="btn btn-primary btn-sm">
                  🔄 替换文字加载
                </button>
                <button @click="loadProjectDirectly(project)" class="btn btn-success btn-sm">
                  📁 直接加载
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

    <!-- 页脚 -->
    <div class="footer">
      <p>Powered by <span class="signature">youtiaoguagua</span></p>
    </div>
  </div>
</template>

<script>
import { Canvas, FabricText, FabricImage } from 'fabric'
import { encode } from 'modern-gif'
import { saveAs } from 'file-saver'

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
      // 播放控制
      isPlaying: false,
      playTimer: null,
      // 应用范围控制
      showApplyModal: false,
      applyStartFrame: 0,
      applyEndFrame: 0,
      // 项目保存/加载
      showSaveModal: false,
      showLoadModal: false,
      savedProjects: [],
      currentProjectName: '',
      selectedProject: null,
      showTextReplaceModal: false,
      textReplacements: [],
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
      }
    }
  },
  computed: {
    currentFrame() {
      return this.frames[this.currentFrameIndex] || { texts: [] }
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
    async loadFrames() {
      // 使用public目录中的图片
      const frameCount = 19
      
      for (let i = 0; i < frameCount; i++) {
        try {
          const frameNumber = i.toString().padStart(2, '0')
          const framePath = `/doro/frame_${frameNumber}_delay-0.08s.png`
          
          const img = new Image()
          img.src = framePath
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = (e) => {
              console.error(`Failed to load image: ${framePath}`, e)
              reject(e)
            }
          })
          
          this.frames.push({
            src: framePath,
            img: img,
            texts: []
          })
          
          console.log(`Loaded frame ${i}: ${framePath}`)
        } catch (error) {
          console.error(`Failed to load frame ${i}:`, error)
        }
      }
      
      console.log(`Total frames loaded: ${this.frames.length}`)
    },

    initCanvas() {
      console.log('Initializing canvas...')
      this.canvas = this.$refs.canvas
      if (!this.canvas) {
        console.error('Canvas element not found')
        return
      }
      
      console.log('Canvas element found, setting up dimensions...')
      
      // 首先设置画布尺寸
      if (this.frames.length > 0) {
        const firstImg = this.frames[0].img
        this.canvasSize.width = firstImg.naturalWidth || 400
        this.canvasSize.height = firstImg.naturalHeight || 400
        
        // 设置canvas元素的实际尺寸
        this.canvas.width = this.canvasSize.width
        this.canvas.height = this.canvasSize.height
        this.canvas.style.width = this.canvasSize.width + 'px'
        this.canvas.style.height = this.canvasSize.height + 'px'
      }
      
      console.log('Creating Fabric canvas...')
      try {
        // 使用setTimeout确保DOM完全准备好
        setTimeout(() => {
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

    saveCurrentFrameTexts() {
      // 从fabric对象更新文字位置
      const fabricObjects = this.fabricCanvas.getObjects()
      fabricObjects.forEach(obj => {
        if (obj.textDataIndex !== undefined) {
          const textData = this.currentFrame.texts[obj.textDataIndex]
          if (textData) {
            textData.left = obj.left
            textData.top = obj.top
          }
        }
      })
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

    applyToAllFrames() {
      if (this.currentFrame.texts.length === 0) {
        alert('当前帧没有文字可以应用')
        return
      }

      // 设置默认范围
      this.applyStartFrame = 0
      this.applyEndFrame = this.frames.length - 1
      this.showApplyModal = true
    },

    applyToFrameRange() {
      if (this.currentFrame.texts.length === 0) {
        return
      }

      // 验证范围
      const start = Math.max(0, Math.min(this.applyStartFrame, this.frames.length - 1))
      const end = Math.max(start, Math.min(this.applyEndFrame, this.frames.length - 1))

      const currentTexts = JSON.parse(JSON.stringify(this.currentFrame.texts))
      
      for (let i = start; i <= end; i++) {
        // 跳过当前帧，避免重复应用
        if (i === this.currentFrameIndex) continue
        
        this.frames[i].texts = JSON.parse(JSON.stringify(currentTexts))
      }

      this.showApplyModal = false
      alert(`文字已应用到第 ${start + 1} 帧到第 ${end + 1} 帧`)
    },

    closeApplyModal() {
      this.showApplyModal = false
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
          texts: JSON.parse(JSON.stringify(frame.texts))
        })),
        settings: {
          gifDelay: this.gifDelay,
          defaultTextStyle: JSON.parse(JSON.stringify(this.defaultTextStyle)),
          canvasSize: { ...this.canvasSize }
        },
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
    applyProjectData(project) {
      // 停止播放
      this.stopPlay()

      // 恢复设置
      this.gifDelay = project.settings.gifDelay || 80
      this.defaultTextStyle = { ...project.settings.defaultTextStyle }
      if (project.settings.canvasSize) {
        this.canvasSize = { ...project.settings.canvasSize }
      }

      // 恢复帧数据
      project.frames.forEach((savedFrame, index) => {
        if (this.frames[index]) {
          this.frames[index].texts = JSON.parse(JSON.stringify(savedFrame.texts))
        }
      })

      // 重置当前状态
      this.currentFrameIndex = 0
      this.selectedTextIndex = -1

      // 重新绘制当前帧
      if (this.fabricCanvas) {
        this.drawCurrentFrame()
      }
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
    }
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
}

.settings-panel h3, .settings-panel h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1em;
}

.text-settings {
  margin-bottom: 20px;
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
  
    @media (max-width: 1200px) {
    #app {
      padding: 15px 15px 80px 15px;
    }
    
    .main-container {
      flex-direction: column;
    }
    
    .frames-panel, .settings-panel {
      width: 100%;
    }
    
    .frames-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }
  }
</style>
