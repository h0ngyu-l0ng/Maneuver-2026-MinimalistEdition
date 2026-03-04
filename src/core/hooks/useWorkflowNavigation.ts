/**
 * useWorkflowNavigation - Configurable scouting workflow navigation
 * 
 * This hook provides navigation helpers based on the workflow configuration
 * in game-schema.ts. It determines which pages are enabled and provides
 * methods to navigate between them.
 */

import { useMemo, useCallback } from 'react';
import { workflowConfig, type WorkflowRoutePage } from '@/game-template/game-schema';
import { useScout } from '@/core/contexts/ScoutContext';

type WorkflowNavPage = WorkflowRoutePage | 'gameStart' | 'commentScoutMatch';

// Page route mappings (only includes routable pages, not visibility flags)
const PAGE_ROUTES: Record<WorkflowNavPage, string> = {
    gameStart: '/game-start',
    commentScoutMatch: '/comment-scout-match',
    autoStart: '/auto-start',
    autoScoring: '/auto-scoring',
    teleopScoring: '/teleop-scoring',
    endgame: '/endgame',
};

// Ordered list of all possible pages
const DEFAULT_PAGES: WorkflowNavPage[] = [
    'gameStart',
    'autoStart',
    'autoScoring',
    'teleopScoring',
    'endgame',
];

const COMMENT_DEFAULT_PAGES: WorkflowNavPage[] = [
    'gameStart',
    'commentScoutMatch',
];

export interface WorkflowNavigation {
    /** Ordered list of enabled pages */
    enabledPages: WorkflowNavPage[];

    /** Get the next page in the workflow, or null if this is the last page */
    getNextPage: (currentPage: WorkflowNavPage) => WorkflowNavPage | null;

    /** Get the previous page in the workflow, or null if this is the first page */
    getPrevPage: (currentPage: WorkflowNavPage) => WorkflowNavPage | null;

    /** Check if the given page is the last page (should show submit button) */
    isLastPage: (currentPage: WorkflowNavPage) => boolean;

    /** Check if the given page is the first page */
    isFirstPage: (currentPage: WorkflowNavPage) => boolean;

    /** Get the route path for a page */
    getRoute: (page: WorkflowNavPage) => string;

    /** Get the route for the next page */
    getNextRoute: (currentPage: WorkflowNavPage) => string | null;

    /** Get the route for the previous page */
    getPrevRoute: (currentPage: WorkflowNavPage) => string | null;

    /** Check if a specific page is enabled */
    isPageEnabled: (page: WorkflowRoutePage) => boolean;

    /** Whether the workflow config is valid (at least one scoring page enabled) */
    isConfigValid: boolean;
}

export function useWorkflowNavigation(): WorkflowNavigation {
    const { currentScoutRoles } = useScout();
    const isCommentScouter = currentScoutRoles?.includes('commentScouter') === true;

    // Validate that at least one page is enabled
    const isConfigValid = Object.values(workflowConfig.pages).some(enabled => enabled);

    // Build ordered list of enabled pages
    const enabledPages = useMemo(() => {
        if (isCommentScouter) {
            return COMMENT_DEFAULT_PAGES;
        }

        return DEFAULT_PAGES.filter(page => {
            // gameStart is always enabled
            if (page === 'gameStart') return true;
            if (page === 'commentScoutMatch') return false;
            // Check workflow config for other pages
            return workflowConfig.pages[page] !== false;
        });
    }, [isCommentScouter]);

    const getNextPage = useCallback((currentPage: WorkflowNavPage): WorkflowNavPage | null => {
        const currentIndex = enabledPages.indexOf(currentPage);
        if (currentIndex === -1 || currentIndex === enabledPages.length - 1) {
            return null;
        }
        return enabledPages[currentIndex + 1] ?? null;
    }, [enabledPages]);

    const getPrevPage = useCallback((currentPage: WorkflowNavPage): WorkflowNavPage | null => {
        const currentIndex = enabledPages.indexOf(currentPage);
        if (currentIndex <= 0) {
            return null;
        }
        return enabledPages[currentIndex - 1] ?? null;
    }, [enabledPages]);

    const isLastPage = useCallback((currentPage: WorkflowNavPage) => {
        const currentIndex = enabledPages.indexOf(currentPage);
        return currentIndex === enabledPages.length - 1;
    }, [enabledPages]);

    const isFirstPage = useCallback((currentPage: WorkflowNavPage) => {
        const currentIndex = enabledPages.indexOf(currentPage);
        return currentIndex === 0;
    }, [enabledPages]);

    const getRoute = useCallback((page: WorkflowNavPage) => {
        return PAGE_ROUTES[page];
    }, []);

    const getNextRoute = useCallback((currentPage: WorkflowNavPage) => {
        const nextPage = getNextPage(currentPage);
        return nextPage ? PAGE_ROUTES[nextPage] : null;
    }, [getNextPage]);

    const getPrevRoute = useCallback((currentPage: WorkflowNavPage) => {
        const prevPage = getPrevPage(currentPage);
        return prevPage ? PAGE_ROUTES[prevPage] : null;
    }, [getPrevPage]);

    const isPageEnabled = useCallback((page: WorkflowRoutePage) => {
        return workflowConfig.pages[page] !== false;
    }, []);

    return {
        enabledPages,
        getNextPage,
        getPrevPage,
        isLastPage,
        isFirstPage,
        getRoute,
        getNextRoute,
        getPrevRoute,
        isPageEnabled,
        isConfigValid,
    };
}
