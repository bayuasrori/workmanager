<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    export let type: any;
    export let data: any;
    export let options: any;

    let canvas: HTMLCanvasElement;
    let chart: Chart;

    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            chart = new Chart(ctx, {
                type,
                data,
                options
            });
        }

        return () => {
            chart?.destroy();
        };
    });

    $: if (chart && data) {
        chart.data = data;
        chart.update();
    }

    $: if (chart && options) {
        chart.options = options;
        chart.update();
    }
</script>

<canvas bind:this={canvas}></canvas>
