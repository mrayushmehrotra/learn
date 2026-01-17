import { useQuery, useMutation } from '@tanstack/react-query';
import { repoService } from '@/services';
import { useAuthStore } from '@/stores';

export function useGitHubRepos() {
    return useQuery({
        queryKey: ['github-repos'],
        queryFn: () => repoService.listGitHubRepos(),
    });
}

export function useConnectRepo() {
    const refreshUser = useAuthStore(state => state.refreshUser);

    return useMutation({
        mutationFn: (repo: { repoId: number; fullName: string }) =>
            repoService.connectRepo(repo),
        onSuccess: () => {
            refreshUser();
        },
    });
}

export function useDisconnectRepo() {
    const refreshUser = useAuthStore(state => state.refreshUser);

    return useMutation({
        mutationFn: (repoId: number) => repoService.disconnectRepo(repoId),
        onSuccess: () => {
            refreshUser();
        },
    });
}
