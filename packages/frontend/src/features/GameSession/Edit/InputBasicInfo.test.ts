import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InputBasicInfo from '@/features/GameSession/Edit/InputBasicInfo.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';

const labelsOf = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAllComponents(BaseTextBox).map((box) => box.props('label'));

const boxByLabel = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper
    .findAllComponents(BaseTextBox)
    .find((box) => box.props('label') === label);

describe('InputBasicInfo', () => {
  it('募集人数の入力欄を持たない（定員はロビーの関心事へ移った）', () => {
    // Arrange / Act
    const wrapper = mount(InputBasicInfo);

    // Assert
    expect(labelsOf(wrapper)).not.toContain('募集人数（自分を含めて）');
  });

  it('ロビーの既定値をプレースホルダで示す', () => {
    // Arrange
    // 空欄のままならロビーの値が表示される、と伝えるため（design-v2 §5-5）
    const wrapper = mount(InputBasicInfo, {
      props: {
        lobbyDefaults: {
          title: 'マダミス「蒼き月」',
          scenarioName: '蒼き月の夜',
          location: 'オンライン',
        },
      },
    });

    // Act
    const titleBox = boxByLabel(wrapper, 'この開催の呼び名');
    const scenarioBox = boxByLabel(wrapper, 'シナリオタイトル');

    // Assert
    expect(titleBox?.props('placeholder')).toBe(
      '未入力なら「マダミス「蒼き月」」',
    );
    expect(scenarioBox?.props('placeholder')).toBe('未入力なら「蒼き月の夜」');
  });

  it('ロビーの既定値が無ければプレースホルダは空にする', () => {
    // Arrange / Act
    const wrapper = mount(InputBasicInfo);

    // Assert
    expect(boxByLabel(wrapper, 'この開催の呼び名')?.props('placeholder')).toBe(
      '',
    );
  });
});
