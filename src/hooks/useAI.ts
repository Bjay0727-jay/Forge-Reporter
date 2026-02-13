/**
 * ForgeComply 360 Reporter - AI Hook
 * Manages AI-powered writing assistance state
 */

import { useState, useCallback } from 'react';
import {
  generateSectionContent,
  type AIGenerateRequest,
  type AIGenerateResponse,
  type SystemContext,
} from '../services/ai';

export type AIStatus = 'idle' | 'generating' | 'success' | 'error';

export interface AIState {
  status: AIStatus;
  content: string | null;
  error: string | null;
  model: string | null;
}

export interface AIActions {
  /**
   * Generate content for a section
   */
  generate: (
    sectionKey: string,
    sectionLabel: string,
    context: SystemContext,
    currentContent?: string
  ) => Promise<string | null>;

  /**
   * Refine existing content
   */
  refine: (
    sectionKey: string,
    sectionLabel: string,
    context: SystemContext,
    currentContent: string,
    instructions?: string
  ) => Promise<string | null>;

  /**
   * Expand existing content
   */
  expand: (
    sectionKey: string,
    sectionLabel: string,
    context: SystemContext,
    currentContent: string
  ) => Promise<string | null>;

  /**
   * Clear AI state
   */
  clear: () => void;

  /**
   * Accept generated content
   */
  accept: () => string | null;

  /**
   * Dismiss generated content
   */
  dismiss: () => void;
}

/**
 * Hook for AI writing assistance
 */
export function useAI(): [AIState, AIActions] {
  const [state, setState] = useState<AIState>({
    status: 'idle',
    content: null,
    error: null,
    model: null,
  });

  const runGeneration = useCallback(
    async (request: AIGenerateRequest): Promise<string | null> => {
      setState({
        status: 'generating',
        content: null,
        error: null,
        model: null,
      });

      try {
        const response: AIGenerateResponse = await generateSectionContent(request);

        setState({
          status: 'success',
          content: response.content,
          error: null,
          model: response.model || null,
        });

        return response.content;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'AI generation failed';
        setState({
          status: 'error',
          content: null,
          error: errorMessage,
          model: null,
        });
        return null;
      }
    },
    []
  );

  const generate = useCallback(
    async (
      sectionKey: string,
      sectionLabel: string,
      context: SystemContext,
      currentContent?: string
    ): Promise<string | null> => {
      return runGeneration({
        sectionKey,
        sectionLabel,
        currentContent,
        systemContext: context,
        mode: 'generate',
      });
    },
    [runGeneration]
  );

  const refine = useCallback(
    async (
      sectionKey: string,
      sectionLabel: string,
      context: SystemContext,
      currentContent: string,
      instructions?: string
    ): Promise<string | null> => {
      return runGeneration({
        sectionKey,
        sectionLabel,
        currentContent,
        systemContext: context,
        mode: 'refine',
        customInstructions: instructions,
      });
    },
    [runGeneration]
  );

  const expand = useCallback(
    async (
      sectionKey: string,
      sectionLabel: string,
      context: SystemContext,
      currentContent: string
    ): Promise<string | null> => {
      return runGeneration({
        sectionKey,
        sectionLabel,
        currentContent,
        systemContext: context,
        mode: 'expand',
      });
    },
    [runGeneration]
  );

  const clear = useCallback(() => {
    setState({
      status: 'idle',
      content: null,
      error: null,
      model: null,
    });
  }, []);

  const accept = useCallback((): string | null => {
    const content = state.content;
    setState({
      status: 'idle',
      content: null,
      error: null,
      model: null,
    });
    return content;
  }, [state.content]);

  const dismiss = useCallback(() => {
    setState({
      status: 'idle',
      content: null,
      error: null,
      model: null,
    });
  }, []);

  const actions: AIActions = {
    generate,
    refine,
    expand,
    clear,
    accept,
    dismiss,
  };

  return [state, actions];
}
