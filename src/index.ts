export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理根路径，返回HTML页面
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(getHTMLPage(), {
        headers: {
          "content-type": "text/html",
        },
      });
    }
    
    // 处理图片生成API
    if (url.pathname === "/generate" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const prompt = formData.get("prompt") as string;
        
        if (!prompt || prompt.trim() === "") {
          return new Response("Prompt is required", { status: 400 });
        }

        const inputs = {
          prompt: prompt.trim(),
        };

        const response = await env.AI.run(
          "@cf/stabilityai/stable-diffusion-xl-base-1.0",
          inputs,
        );

        return new Response(response, {
          headers: {
            "content-type": "image/png",
          },
        });
      } catch (error) {
        return new Response("Error generating image: " + error.message, { 
          status: 500 
        });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

function getHTMLPage(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 图片生成器</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        
        textarea {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            resize: vertical;
            min-height: 120px;
            transition: border-color 0.3s ease;
        }
        
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .generate-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .generate-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .generate-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        
        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .result {
            text-align: center;
            margin-top: 30px;
        }
        
        .result img {
            max-width: 100%;
            border-radius: 15px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
            margin-bottom: 15px;
        }
        
        .error {
            color: #e74c3c;
            background: #ffebee;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
        }
        
        .download-btn {
            display: inline-block;
            padding: 10px 20px;
            background: #27ae60;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 10px;
            transition: background 0.3s ease;
        }
        
        .download-btn:hover {
            background: #219a52;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 AI 图片生成器</h1>
        
        <form id="generateForm">
            <div class="form-group">
                <label for="prompt">请输入图片描述（英文效果更佳）：</label>
                <textarea 
                    id="prompt" 
                    name="prompt" 
                    placeholder="例如：cyberpunk cat, digital art, neon lights, futuristic city background"
                    required
                ></textarea>
            </div>
            
            <button type="submit" class="generate-btn" id="generateBtn">
                ✨ 生成图片
            </button>
        </form>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>AI 正在创作中，请稍候...</p>
        </div>
        
        <div class="result" id="result"></div>
    </div>

    <script>
        const form = document.getElementById('generateForm');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const generateBtn = document.getElementById('generateBtn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const prompt = formData.get('prompt');
            
            if (!prompt.trim()) {
                alert('请输入图片描述');
                return;
            }
            
            // 显示加载状态
            generateBtn.disabled = true;
            generateBtn.textContent = '生成中...';
            loading.style.display = 'block';
            result.innerHTML = '';
            
            try {
                const response = await fetch('/generate', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(await response.text());
                }
                
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                
                result.innerHTML = \`
                    <img src="\${imageUrl}" alt="Generated Image" />
                    <br>
                    <a href="\${imageUrl}" download="ai-generated-image.png" class="download-btn">
                        📥 下载图片
                    </a>
                \`;
                
            } catch (error) {
                result.innerHTML = \`
                    <div class="error">
                        生成失败：\${error.message}
                    </div>
                \`;
            } finally {
                // 恢复按钮状态
                generateBtn.disabled = false;
                generateBtn.textContent = '✨ 生成图片';
                loading.style.display = 'none';
            }
        });
    </script>
</body>
</html>
  `;
}
