<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome(): void {
  router.push('/')
}
</script>

<template>
  <div class="thanks-page">
    <div class="thanks-container">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h1>提交成功</h1>
      <p>感谢您的参与，您的回答已提交</p>
      <button class="btn-home" @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.thanks-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: $spacing-lg;
}

.thanks-container {
  text-align: center;
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-2xl;
  box-shadow: $shadow-xl;
  max-width: 400px;
  width: 100%;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto $spacing-lg;
  background: rgba($color-success, 0.1);
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.5s ease;

  svg {
    width: 40px;
    height: 40px;
    color: $color-success;
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

p {
  color: $text-secondary;
  margin-bottom: $spacing-xl;
}

.btn-home {
  padding: $spacing-md $spacing-xl;
  background: $color-primary;
  color: $text-white;
  font-weight: 600;
  border-radius: $radius-lg;
  transition: all $transition-fast;

  &:hover {
    background: $color-primary-hover;
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}
</style>