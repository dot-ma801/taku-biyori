<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';

const model = defineModel<boolean>();

const emit = defineEmits<{
  share: [];
}>();

const onClickShare = () => {
  emit('share');
};
</script>

<template>
  <!--
    公開は取り返しの付きにくい操作（誰が読んだかは戻せない）なので、
    非公開に戻すときと違い確認を挟む（要求 §4 の誤公開の事故防止）。
  -->
  <BaseDialog
    v-model="model"
    title="メモを公開する"
    description="卓が完了・中止すると、公開したメモはこの卓のページを開ける人なら誰でも（未ログインの人・ゲストを含めて）読めます。いつでも非公開に戻せます。"
  >
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">戻る</BaseButton>
      <BaseButton @click="onClickShare">公開する</BaseButton>
    </template>
  </BaseDialog>
</template>
